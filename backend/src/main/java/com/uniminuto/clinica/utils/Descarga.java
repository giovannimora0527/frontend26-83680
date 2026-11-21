package com.uniminuto.clinica.utils;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import java.nio.charset.StandardCharsets;

/**
 * Respuestas de descarga de archivos (PDF / Excel).
 */
public final class Descarga {

    public static final String XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    private Descarga() {
    }

    public static ResponseEntity<byte[]> pdf(byte[] contenido, String nombre) {
        return archivo(contenido, nombre, MediaType.APPLICATION_PDF_VALUE);
    }

    public static ResponseEntity<byte[]> excel(byte[] contenido, String nombre) {
        return archivo(contenido, nombre, XLSX);
    }

    public static ResponseEntity<byte[]> archivo(byte[] contenido, String nombre, String tipo) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(tipo));
        headers.setContentDisposition(ContentDisposition.attachment().filename(nombre, StandardCharsets.UTF_8).build());
        headers.setContentLength(contenido.length);
        return ResponseEntity.ok().headers(headers).body(contenido);
    }
}
