package com.uniminuto.clinica.utils;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Datos de la clínica impresos en fórmulas, facturas, comprobantes y reportes
 * (application.properties: clinica.datos.*).
 */
@Component
@Getter
public class DatosClinica {

    @Value("${clinica.datos.nombre}")
    private String nombre;

    @Value("${clinica.datos.nit}")
    private String nit;

    @Value("${clinica.datos.direccion}")
    private String direccion;

    @Value("${clinica.datos.telefono}")
    private String telefono;
}
