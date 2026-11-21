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
 * Configuración de Swagger UI: /clinica/v1/swagger-ui.html
 * Para probar: POST /auth/login, copiar el token y usar el botón "Authorize".
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI clinicaOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("API Clínica Veterinaria Uniminuto")
                        .version("1.0.0")
                        .description("Inventario, citas con calendario, atención médica, fórmulas, facturación, "
                                + "reportes y despacho de medicamentos. Autenticación Bearer (POST /auth/login).")
                        .contact(new Contact().name("Programación Web Full Stack - Uniminuto")))
                .addSecurityItem(new SecurityRequirement().addList("bearerAuth"))
                .components(new Components().addSecuritySchemes("bearerAuth",
                        new SecurityScheme().type(SecurityScheme.Type.HTTP).scheme("bearer")
                                .description("Token obtenido en /auth/login")));
    }
}
