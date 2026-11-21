package com.uniminuto.clinica.api;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Tag(name = "00. Estado del servicio")
@RequestMapping("/clinica")
public interface ClinicaApi {

    @Operation(summary = "Verifica que el servicio esté arriba (público)")
    @GetMapping(value = "/test", produces = "text/plain")
    ResponseEntity<String> testService();
}
