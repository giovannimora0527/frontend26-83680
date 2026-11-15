package com.uniminuto.clinica.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.AuthorizeHttpRequestsConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * Seguridad de la API: autenticación con token JWT y control de acceso por rol.
 * Los permisos de cada servicio se definen aquí, en el backend, de modo que
 * no dependen de las opciones visibles en la interfaz.
 */
@Configuration
public class SeguridadConfig {

    /**
     * Rol de administrador.
     */
    private static final String ADMIN = "ADMIN";

    /**
     * Rol de médico veterinario.
     */
    private static final String VETERINARIO = "VETERINARIO";

    /**
     * Rol de recepción o secretaría.
     */
    private static final String RECEPCIONISTA = "RECEPCIONISTA";

    /**
     * Rol del personal de despacho de medicamentos.
     */
    private static final String DESPACHO = "DESPACHO_MEDICO";

    /**
     * Crea la cadena de filtros: sin sesión en el servidor, con CORS y con
     * validación del token en cada petición.
     *
     * @param http          configurador de seguridad.
     * @param conversor     convierte el token en el usuario autenticado.
     * @param erroresAcceso escribe las respuestas 401 y 403.
     * @return cadena de filtros.
     * @throws Exception si la configuración es inválida.
     */
    @Bean
    public SecurityFilterChain cadenaSeguridad(HttpSecurity http, UsuarioJwtConversor conversor,
                                               ErroresAccesoHandler erroresAcceso) throws Exception {
        return http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(this::definirPermisos)
                .oauth2ResourceServer(o -> o
                        .jwt(j -> j.jwtAuthenticationConverter(conversor))
                        .authenticationEntryPoint(erroresAcceso)
                        .accessDeniedHandler(erroresAcceso))
                .exceptionHandling(e -> e
                        .authenticationEntryPoint(erroresAcceso)
                        .accessDeniedHandler(erroresAcceso))
                .build();
    }

    /**
     * Matriz de permisos por servicio. Lo que no aparece aquí queda denegado.
     *
     * @param permisos registro de reglas de autorización.
     */
    private void definirPermisos(
            AuthorizeHttpRequestsConfigurer<HttpSecurity>.AuthorizationManagerRequestMatcherRegistry permisos) {
        permisos
                // Autenticación.
                .requestMatchers(HttpMethod.POST, "/auth/login").permitAll()
                .requestMatchers("/auth/**").authenticated()

                // Administración de usuarios.
                .requestMatchers("/usuario/**", "/perfil/**").hasRole(ADMIN)

                // Catálogos que consultan varios perfiles y administra solo el administrador.
                .requestMatchers(HttpMethod.GET, "/especializacion/**", "/medico/**", "/raza/**")
                .hasAnyRole(ADMIN, RECEPCIONISTA, VETERINARIO)
                .requestMatchers("/especializacion/**", "/medico/**", "/raza/**").hasRole(ADMIN)

                // Clientes y mascotas: los registra recepción; el veterinario los consulta.
                .requestMatchers(HttpMethod.GET, "/cliente/**", "/mascota/**")
                .hasAnyRole(ADMIN, RECEPCIONISTA, VETERINARIO)
                .requestMatchers("/cliente/**", "/mascota/**").hasAnyRole(ADMIN, RECEPCIONISTA)

                // Citas.
                .requestMatchers("/cita/**").hasAnyRole(ADMIN, RECEPCIONISTA, VETERINARIO)

                // Fórmulas en PDF: también las imprime despacho al entregar (va antes de la regla general).
                .requestMatchers(HttpMethod.GET, "/formula/*/pdf").hasAnyRole(ADMIN, VETERINARIO, DESPACHO)

                // Información clínica: solo el veterinario la registra.
                .requestMatchers(HttpMethod.GET, "/historia/**", "/anotacion/**", "/formula/**")
                .hasAnyRole(ADMIN, VETERINARIO)
                .requestMatchers("/historia/**", "/anotacion/**", "/formula/**").hasRole(VETERINARIO)

                // Despacho: solo el perfil de despacho lo opera; el administrador consulta la trazabilidad.
                .requestMatchers(HttpMethod.GET, "/despacho/historial", "/despacho/*/comprobante")
                .hasAnyRole(ADMIN, DESPACHO)
                .requestMatchers("/despacho/**").hasRole(DESPACHO)

                // Tarifas: las consultan quienes atienden y facturan; solo el administrador las modifica.
                .requestMatchers(HttpMethod.GET, "/servicio/**").hasAnyRole(ADMIN, RECEPCIONISTA, VETERINARIO)
                .requestMatchers("/servicio/**").hasRole(ADMIN)

                // Atención médica: la registra el veterinario; la prefactura también la consultan
                // administración y recepción.
                .requestMatchers(HttpMethod.GET, "/atencion/*/prefactura").hasAnyRole(ADMIN, RECEPCIONISTA, VETERINARIO)
                .requestMatchers(HttpMethod.GET, "/atencion/**").hasAnyRole(ADMIN, VETERINARIO)
                .requestMatchers("/atencion/**").hasRole(VETERINARIO)

                // Facturación: administración y recepción; solo el administrador anula.
                .requestMatchers(HttpMethod.PUT, "/factura/*/anular").hasRole(ADMIN)
                .requestMatchers("/factura/**").hasAnyRole(ADMIN, RECEPCIONISTA)

                // Reportes: el servicio filtra cada reporte por perfil (financieros e inventario solo
                // administrador; gestión médica también recepción).
                .requestMatchers(HttpMethod.GET, "/reporte/**").hasAnyRole(ADMIN, RECEPCIONISTA)

                // Inventario.
                .requestMatchers(HttpMethod.GET, "/medicamento/**").hasAnyRole(ADMIN, VETERINARIO, DESPACHO)
                .requestMatchers("/medicamento/**").hasRole(ADMIN)

                .anyRequest().denyAll();
    }

    /**
     * Clave con la que se firman y verifican los tokens.
     *
     * @param secreto secreto configurado (mínimo 32 caracteres).
     * @return clave HMAC-SHA256.
     */
    @Bean
    public SecretKey claveJwt(@Value("${clinica.jwt.secreto}") String secreto) {
        byte[] bytes = secreto.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) {
            throw new IllegalStateException("clinica.jwt.secreto debe tener al menos 32 caracteres");
        }
        return new SecretKeySpec(bytes, "HmacSHA256");
    }

    /**
     * Firma los tokens que se entregan al iniciar sesión.
     *
     * @param claveJwt clave de firma.
     * @return codificador de tokens.
     */
    @Bean
    public JwtEncoder codificadorJwt(SecretKey claveJwt) {
        return NimbusJwtEncoder.withSecretKey(claveJwt).algorithm(MacAlgorithm.HS256).build();
    }

    /**
     * Verifica la firma y la vigencia de los tokens recibidos.
     *
     * @param claveJwt clave de firma.
     * @return decodificador de tokens.
     */
    @Bean
    public JwtDecoder decodificadorJwt(SecretKey claveJwt) {
        return NimbusJwtDecoder.withSecretKey(claveJwt).macAlgorithm(MacAlgorithm.HS256).build();
    }

    /**
     * Orígenes autorizados a consumir la API desde el navegador.
     *
     * @param origenes orígenes separados por coma.
     * @return configuración CORS.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource(@Value("${clinica.cors.origenes}") List<String> origenes) {
        CorsConfiguration cors = new CorsConfiguration();
        cors.setAllowedOrigins(origenes);
        cors.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        cors.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        cors.setExposedHeaders(List.of("Content-Disposition"));

        UrlBasedCorsConfigurationSource fuente = new UrlBasedCorsConfigurationSource();
        fuente.registerCorsConfiguration("/**", cors);
        return fuente;
    }
}
