package com.nepnlp.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record TextRequest(
        @NotBlank(message = "text must not be blank")
        @Size(max = 20000, message = "text too long")
        String text
) {}
