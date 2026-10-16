package com.uniminuto.clinica;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/** Punto de entrada de la API REST de la clínica veterinaria. */
@SpringBootApplication
public class ClinicaApplication {
    /** Inicia la aplicación Spring Boot. */
    public static void main(String[] args) {
        SpringApplication.run(ClinicaApplication.class, args);
    }
}
