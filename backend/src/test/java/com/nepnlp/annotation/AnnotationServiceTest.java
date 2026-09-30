package com.nepnlp.annotation;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.nepnlp.annotation.AnnotationDtos.AdjudicateRequest;
import com.nepnlp.annotation.AnnotationDtos.ImportItem;
import com.nepnlp.annotation.AnnotationDtos.LabelRequest;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.data.mongo.DataMongoTest;
import org.springframework.data.mongodb.core.MongoTemplate;

/** The whole double-annotation workflow against an embedded MongoDB (test data only). */
@DataMongoTest
class AnnotationServiceTest {

    static final String POS = "सकारात्मक";
    static final String NEG = "नकारात्मक";
    static final String NEU = "तटस्थ";

    @Autowired AnnotationItemRepository items;
    @Autowired AnnotationRepository labels;
    @Autowired AdjudicationRepository adjudications;
    @Autowired MongoTemplate mongo;
    AnnotationService service;

    @BeforeEach
    void setUp() {
        items.deleteAll();
        labels.deleteAll();
        adjudications.deleteAll();
        service = new AnnotationService(items, labels, adjudications, mongo, List.of(POS, NEG, NEU));
    }

    private static ImportItem item(String text) {
        return new ImportItem(text, "test", null, "devanagari", false, "b1");
    }

    private void label(String itemId, String annotator, String label) {
        service.label(new LabelRequest(itemId, annotator, label, List.of(), null));
    }

    @Test
    void importSkipsDuplicatesWithinTheBatchAndAgainstTheDatabase() {
        var r1 = service.importItems(List.of(item("क"), item("ख"), item("क ")), 1L);
        assertThat(r1.imported()).isEqualTo(2);
        assertThat(r1.duplicatesSkipped()).isEqualTo(1);
        assertThat(service.importItems(List.of(item("ख"), item("ग")), 1L).imported()).isEqualTo(1);
        assertThat(items.count()).isEqualTo(3);
    }

    @Test
    void annotatorsSeeTheSameOrderIndependentlyAndProgressAdvances() {
        service.importItems(List.of(item("क"), item("ख"), item("ग")), 7L);
        String firstA = service.next("A1").item().id();
        String firstB = service.next("A2").item().id();
        assertThat(firstA).isEqualTo(firstB);

        label(firstA, "A1", POS);
        var nextA = service.next("A1");
        assertThat(nextA.item().id()).isNotEqualTo(firstA);
        assertThat(nextA.done()).isEqualTo(1);
        assertThat(nextA.total()).isEqualTo(3);
        assertThat(service.next("A2").item().id()).isEqualTo(firstB);   // A2 unaffected by A1
    }

    @Test
    void finishedAnnotatorGetsNoItem() {
        service.importItems(List.of(item("क")), 1L);
        label(service.next("A1").item().id(), "A1", NEU);
        assertThat(service.next("A1").item()).isNull();
    }

    @Test
    void relabellingOverwritesInsteadOfDuplicating() {
        service.importItems(List.of(item("क")), 1L);
        String id = service.next("A1").item().id();
        label(id, "A1", POS);
        label(id, "A1", NEG);
        assertThat(labels.findAll()).singleElement().satisfies(a -> assertThat(a.getLabel()).isEqualTo(NEG));
    }

    @Test
    void disagreementsAdjudicationAndExport() {
        service.importItems(List.of(item("क"), item("ख"), item("ग")), 3L);
        List<String> ids = items.findAll().stream().map(AnnotationItem::getId).toList();
        label(ids.get(0), "A1", POS);  label(ids.get(0), "A2", POS);   // agree
        label(ids.get(1), "A1", POS);  label(ids.get(1), "A2", NEG);   // disagree
        label(ids.get(2), "A1", "skip"); label(ids.get(2), "A2", NEU); // skip is not a disagreement

        var dis = service.disagreements();
        assertThat(dis).singleElement().satisfies(d -> {
            assertThat(d.item().id()).isEqualTo(ids.get(1));
            assertThat(d.labels()).extracting("label").containsExactlyInAnyOrder(POS, NEG);
        });
        var p = service.progress();
        assertThat(p.itemsWithTwoOrMoreLabels()).isEqualTo(3);
        assertThat(p.labelsByAnnotator()).containsEntry("A1", 3L).containsEntry("A2", 3L);
        assertThat(p.disagreements()).isEqualTo(1);

        service.adjudicate(new AdjudicateRequest(ids.get(1), "ADJ", NEG, "negative overall"));
        assertThat(service.disagreements()).isEmpty();

        var export = service.export();
        assertThat(export).hasSize(3);
        assertThat(export).filteredOn(e -> e.id().equals(ids.get(1)))
                .singleElement().satisfies(e -> assertThat(e.adjudicatedLabel()).isEqualTo(NEG));
        assertThat(export).allSatisfy(e -> assertThat(e.annotations()).hasSize(2));
    }

    @Test
    void rejectsUnknownLabelsAndItems() {
        service.importItems(List.of(item("क")), 1L);
        String id = service.next("A1").item().id();
        assertThatThrownBy(() -> label(id, "A1", "happy")).isInstanceOf(AnnotationService.BadLabelException.class);
        assertThatThrownBy(() -> label("nope", "A1", POS)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.adjudicate(new AdjudicateRequest(id, "ADJ", "skip", null)))
                .isInstanceOf(AnnotationService.BadLabelException.class);
    }
}
