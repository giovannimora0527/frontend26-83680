package com.uniminuto.clinica.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Documentación OpenAPI (Swagger) de la API de la clínica.
 * <p>
 * Swagger UI queda en {@code /clinica/v1/swagger-ui.html}. Para probar los servicios
 * protegidos: ejecutar {@code POST /auth/login}, copiar el token y pegarlo en
 * "Authorize". Los permisos por perfil se aplican igual que desde el frontend.
 * </p>
 */
@Configuration
public class OpenApiConfig {

    /** Nombre del esquema de seguridad. */
    private static final String ESQUEMA = "bearer-jwt";

    /**
     * Información general de la API y autenticación con token JWT.
     *
     * @return definición OpenAPI.
     */
    @Bean
    public OpenAPI apiClinica() {
        return new OpenAPI()
                .info(new Info()
                        .title("API Clínica Veterinaria Uniminuto")
                        .version("1.0")
                        .description("Servicios del sistema de gestión administrativa, médica y financiera: "
                                + "autenticación y perfiles, clientes y mascotas, citas y calendario, inventario y "
                                + "carga masiva, fórmulas, despacho, atención médica, tarifas, facturación y reportes. "
                                + "Inicie sesión con POST /auth/login y use el token en 'Authorize'.")
                        .contact(new Contact().name("Programación Web Full Stack — Uniminuto")))
                .components(new Components().addSecuritySchemes(ESQUEMA, new SecurityScheme()
                        .type(SecurityScheme.Type.HTTP)
                        .scheme("bearer")
                        .bearerFormat("JWT")
                        .description("Token obtenido en POST /auth/login")))
                .addSecurityItem(new SecurityRequirement().addList(ESQUEMA));
    }
}
