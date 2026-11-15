package com.uniminuto.clinica.config;

import com.uniminuto.clinica.entity.Usuario;
import com.uniminuto.clinica.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Convierte un token válido en el usuario autenticado. El rol y el estado se
 * leen de la base de datos en cada petición, así un cambio de rol o una
 * inactivación aplican de inmediato aunque el token siga vigente.
 */
@Component
public class UsuarioJwtConversor implements Converter<Jwt, AbstractAuthenticationToken> {

    /**
     * Repositorio de usuarios.
     */
    @Autowired
    private UsuarioRepository usuarioRepository;

    /**
     * {@inheritDoc}
     */
    @Override
    public AbstractAuthenticationToken convert(Jwt token) {
        Usuario usuario = usuarioRepository.findByUsernameIgnoreCase(token.getSubject())
                .filter(u -> Boolean.TRUE.equals(u.getActivo()) && Boolean.TRUE.equals(u.getPerfil().getActivo()))
                .orElseThrow(() -> new BadCredentialsException("Usuario inexistente o inactivo"));
        return new JwtAuthenticationToken(token,
                List.of(new SimpleGrantedAuthority("ROLE_" + usuario.getRol())),
                usuario.getUsername());
    }
}
