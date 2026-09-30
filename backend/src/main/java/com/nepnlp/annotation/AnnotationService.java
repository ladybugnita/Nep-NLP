package com.nepnlp.annotation;

import com.nepnlp.annotation.AnnotationDtos.AdjudicateRequest;
import com.nepnlp.annotation.AnnotationDtos.Disagreement;
import com.nepnlp.annotation.AnnotationDtos.ExportItem;
import com.nepnlp.annotation.AnnotationDtos.ImportItem;
import com.nepnlp.annotation.AnnotationDtos.ImportResult;
import com.nepnlp.annotation.AnnotationDtos.ItemView;
import com.nepnlp.annotation.AnnotationDtos.LabelRequest;
import com.nepnlp.annotation.AnnotationDtos.LabelView;
import com.nepnlp.annotation.AnnotationDtos.NextItem;
import com.nepnlp.annotation.AnnotationDtos.Progress;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.Set;
import java.util.TreeMap;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

/**
 * Double annotation workflow: every annotator labels every item independently (they never
 * see each other's labels), disagreements go to an adjudicator, and the export feeds
 * ``scripts/iaa.py`` (Cohen's kappa) and ``scripts/export_dataset.py``.
 */
@Service
public class AnnotationService {

    /** Excluded from agreement statistics and from the dataset unless adjudicated. */
    public static final String SKIP = "skip";

    private final AnnotationItemRepository items;
    private final AnnotationRepository labels;
    private final AdjudicationRepository adjudications;
    private final MongoTemplate mongo;
    private final List<String> labelSet;

    public AnnotationService(AnnotationItemRepository items, AnnotationRepository labels,
                             AdjudicationRepository adjudications, MongoTemplate mongo,
                             @Value("${nepnlp.annotation.labels:सकारात्मक,नकारात्मक,तटस्थ}") List<String> labelSet) {
        this.items = items;
        this.labels = labels;
        this.adjudications = adjudications;
        this.mongo = mongo;
        this.labelSet = List.copyOf(labelSet);
    }

    public List<String> labelSet() {
        return labelSet;
    }

    public ImportResult importItems(List<ImportItem> in, Long seed) {
        Random rng = new Random(seed == null ? 42L : seed);
        int imported = 0;
        int dup = 0;
        Set<String> seen = new HashSet<>();
        for (ImportItem it : in) {
            String text = it.text().strip();
            if (!seen.add(text) || items.existsByText(text)) {
                dup++;
                continue;
            }
            items.save(new AnnotationItem(text, it.source(), it.url(), it.script(), it.codeMixed(),
                    it.batch(), rng.nextLong()));
            imported++;
        }
        return new ImportResult(imported, dup);
    }

    /** The next item this annotator has not labelled yet (same shuffled order for everyone). */
    public NextItem next(String annotatorId) {
        List<String> done = labels.findByAnnotatorId(annotatorId).stream().map(Annotation::getItemId).toList();
        Query q = new Query(Criteria.where("_id").nin(done)).with(Sort.by("order", "_id")).limit(1);
        AnnotationItem item = mongo.findOne(q, AnnotationItem.class);
        return new NextItem(item == null ? null : ItemView.of(item), done.size(), items.count());
    }

    public LabelView label(LabelRequest req) {
        requireLabel(req.label(), true);
        if (!items.existsById(req.itemId())) {
            throw new IllegalArgumentException("Unknown item: " + req.itemId());
        }
        Annotation a = labels.findByItemIdAndAnnotatorId(req.itemId(), req.annotatorId())
                .map(existing -> {
                    existing.update(req.label(), req.flags(), req.note());
                    return existing;
                })
                .orElseGet(() -> new Annotation(req.itemId(), req.annotatorId(), req.label(), req.flags(), req.note()));
        return LabelView.of(labels.save(a));
    }

    /** Items with ≥ 2 non-skip labels that differ, not yet adjudicated. */
    public List<Disagreement> disagreements() {
        Map<String, List<Annotation>> byItem = labels.findAll().stream()
                .collect(Collectors.groupingBy(Annotation::getItemId, TreeMap::new, Collectors.toList()));
        Set<String> decided = adjudications.findAll().stream().map(Adjudication::getItemId).collect(Collectors.toSet());
        List<Disagreement> out = new ArrayList<>();
        byItem.forEach((itemId, as) -> {
            Set<String> distinct = as.stream().map(Annotation::getLabel).filter(l -> !SKIP.equals(l))
                    .collect(Collectors.toSet());
            long nonSkip = as.stream().filter(a -> !SKIP.equals(a.getLabel())).count();
            if (!decided.contains(itemId) && nonSkip >= 2 && distinct.size() > 1) {
                items.findById(itemId).ifPresent(item ->
                        out.add(new Disagreement(ItemView.of(item), as.stream().map(LabelView::of).toList())));
            }
        });
        return out;
    }

    public Adjudication adjudicate(AdjudicateRequest req) {
        requireLabel(req.label(), false);
        if (!items.existsById(req.itemId())) {
            throw new IllegalArgumentException("Unknown item: " + req.itemId());
        }
        return adjudications.save(new Adjudication(req.itemId(), req.label(), req.adjudicatorId(), req.note()));
    }

    public Progress progress() {
        List<Annotation> all = labels.findAll();
        Map<String, Long> byAnnotator = all.stream()
                .collect(Collectors.groupingBy(Annotation::getAnnotatorId, TreeMap::new, Collectors.counting()));
        long multi = all.stream().collect(Collectors.groupingBy(Annotation::getItemId, Collectors.counting()))
                .values().stream().filter(c -> c >= 2).count();
        return new Progress(items.count(), byAnnotator, multi, disagreements().size(), adjudications.count(), labelSet);
    }

    public List<ExportItem> export() {
        Map<String, List<Annotation>> byItem = labels.findAll().stream()
                .collect(Collectors.groupingBy(Annotation::getItemId));
        Map<String, Adjudication> adj = adjudications.findAll().stream()
                .collect(Collectors.toMap(Adjudication::getItemId, a -> a));
        return items.findAll(Sort.by("order", "_id")).stream().map(i -> {
            Adjudication a = adj.get(i.getId());
            return new ExportItem(i.getId(), i.getText(), i.getSource(), i.getUrl(), i.getScript(),
                    i.getCodeMixed(), i.getBatch(),
                    byItem.getOrDefault(i.getId(), List.of()).stream().map(LabelView::of).toList(),
                    a == null ? null : a.getLabel(), a == null ? null : a.getAdjudicatorId());
        }).toList();
    }

    private void requireLabel(String label, boolean allowSkip) {
        if (!labelSet.contains(label) && !(allowSkip && SKIP.equals(label))) {
            throw new BadLabelException("label must be one of " + labelSet + (allowSkip ? " or 'skip'" : ""));
        }
    }

    /** Invalid label -> HTTP 400 (see AnnotationController). */
    public static class BadLabelException extends RuntimeException {
        public BadLabelException(String message) {
            super(message);
        }
    }
}
