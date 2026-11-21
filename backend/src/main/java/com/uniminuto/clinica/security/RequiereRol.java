package com.uniminuto.clinica.security;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Restringe un endpoint (método) o un controlador completo (clase) a los
 * perfiles indicados. La validación la hace {@link AuthInterceptor} en el
 * backend, independiente de lo que muestre el frontend.
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface RequiereRol {
    String[] value();
}
