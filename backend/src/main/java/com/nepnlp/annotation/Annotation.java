package com.nepnlp.annotation;

import java.time.Instant;
import java.util.List;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

/** One annotator's label for one item (at most one per pair; re-labelling overwrites). */
@Document(collection = "annotations")
@CompoundIndex(name = "item_annotator", def = "{'itemId': 1, 'annotatorId': 1}", unique = true)
public class Annotation {

    @Id
    private String id;
    private String itemId;
    private String annotatorId;
    private String label;
    private List<String> flags;
    private String note;
    private Instant updatedAt = Instant.now();

    public Annotation() {}

    public Annotation(String itemId, String annotatorId, String label, List<String> flags, String note) {
        this.itemId = itemId;
        this.annotatorId = annotatorId;
        update(label, flags, note);
    }

    public void update(String label, List<String> flags, String note) {
        this.label = label;
        this.flags = flags == null ? List.of() : List.copyOf(flags);
        this.note = note;
        this.updatedAt = Instant.now();
    }

    public String getId() { return id; }
    public String getItemId() { return itemId; }
    public String getAnnotatorId() { return annotatorId; }
    public String getLabel() { return label; }
    public List<String> getFlags() { return flags; }
    public String getNote() { return note; }
    public Instant getUpdatedAt() { return updatedAt; }
}
