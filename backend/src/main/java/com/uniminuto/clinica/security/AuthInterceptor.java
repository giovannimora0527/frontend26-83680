package com.uniminuto.clinica.security;

import com.uniminuto.clinica.exception.ForbiddenException;
import com.uniminuto.clinica.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.annotation.AnnotatedElementUtils;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Arrays;

/**
 * Valida el token Bearer de cada petición y los perfiles exigidos con
 * {@link RequiereRol}. Las rutas públicas se excluyen en WebConfig.
 */
@Component
public class AuthInterceptor implements HandlerInterceptor {

    @Autowired
    private AuthService authService;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        ContextoUsuario.limpiar();
        if (!(handler instanceof HandlerMethod handlerMethod) || "OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }
        String header = request.getHeader("Authorization");
        String token = (header != null && header.startsWith("Bearer ")) ? header.substring(7).trim() : null;
        UsuarioActual usuario = authService.validarToken(token);
        ContextoUsuario.establecer(usuario);

        RequiereRol requiere = AnnotatedElementUtils.findMergedAnnotation(handlerMethod.getMethod(), RequiereRol.class);
        if (requiere == null) {
            requiere = AnnotatedElementUtils.findMergedAnnotation(handlerMethod.getBeanType(), RequiereRol.class);
        }
        if (requiere != null && Arrays.stream(requiere.value()).noneMatch(r -> r.equals(usuario.perfilCodigo()))) {
            ContextoUsuario.limpiar();
            throw new ForbiddenException("Su perfil (" + usuario.perfilNombre()
                    + ") no tiene permiso para realizar esta operación.");
        }
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        ContextoUsuario.limpiar();
    }
}
