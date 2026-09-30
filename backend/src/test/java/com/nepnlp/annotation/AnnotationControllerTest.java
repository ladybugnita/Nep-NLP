package com.nepnlp.annotation;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.nepnlp.annotation.AnnotationDtos.ItemView;
import com.nepnlp.annotation.AnnotationDtos.NextItem;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

class AnnotationControllerTest {

    @Nested
    @WebMvcTest(AnnotationController.class)
    class Open {
        @Autowired MockMvc mvc;
        @MockBean AnnotationService service;

        @Test
        void nextReturnsSnakeCaseItem() throws Exception {
            when(service.next("A1")).thenReturn(new NextItem(new ItemView("i1", "k xa", "roman_nepali", false, "t"), 2, 10));
            mvc.perform(get("/api/annotation/next").param("annotator", "A1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.item.text").value("k xa"))
                    .andExpect(jsonPath("$.item.code_mixed").value(false))
                    .andExpect(jsonPath("$.done").value(2));
        }

        @Test
        void rejectsNonPseudonymousAnnotatorIds() throws Exception {
            mvc.perform(get("/api/annotation/next").param("annotator", "Ram Bahadur"))
                    .andExpect(status().isBadRequest());
            mvc.perform(post("/api/annotation/labels").contentType(MediaType.APPLICATION_JSON)
                            .content("{\"item_id\":\"i1\",\"annotator_id\":\"ram@x.com\",\"label\":\"तटस्थ\"}"))
                    .andExpect(status().isBadRequest());
            verify(service, never()).label(any());
        }

        @Test
        void unknownFlagIsRejectedAndBadLabelIs400() throws Exception {
            mvc.perform(post("/api/annotation/labels").contentType(MediaType.APPLICATION_JSON)
                            .content("{\"item_id\":\"i1\",\"annotator_id\":\"A1\",\"label\":\"तटस्थ\",\"flags\":[\"funny\"]}"))
                    .andExpect(status().isBadRequest());
            when(service.label(any())).thenThrow(new AnnotationService.BadLabelException("label must be one of …"));
            mvc.perform(post("/api/annotation/labels").contentType(MediaType.APPLICATION_JSON)
                            .content("{\"item_id\":\"i1\",\"annotator_id\":\"A1\",\"label\":\"happy\"}"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("label must be one of …"));
        }
    }

    @Nested
    @WebMvcTest(AnnotationController.class)
    @TestPropertySource(properties = "nepnlp.annotation.token=s3cret")
    class WithToken {
        @Autowired MockMvc mvc;
        @MockBean AnnotationService service;

        @Test
        void requiresTheToken() throws Exception {
            mvc.perform(get("/api/annotation/progress")).andExpect(status().isForbidden());
            mvc.perform(get("/api/annotation/progress").header("X-Annotation-Token", "wrong"))
                    .andExpect(status().isForbidden());
            mvc.perform(get("/api/annotation/progress").header("X-Annotation-Token", "s3cret"))
                    .andExpect(status().isOk());
        }
    }

    @Nested
    @WebMvcTest
    @TestPropertySource(properties = "nepnlp.annotation.enabled=false")
    class Disabled {
        @Autowired MockMvc mvc;
        @MockBean AnnotationService service;
        @MockBean com.nepnlp.service.NlpService nlp;

        @Test
        void endpointsDoNotExist() throws Exception {
            mvc.perform(get("/api/annotation/progress")).andExpect(status().isNotFound());
        }
    }
}
