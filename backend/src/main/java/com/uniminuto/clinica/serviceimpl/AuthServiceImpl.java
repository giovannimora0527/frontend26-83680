package com.uniminuto.clinica.serviceimpl;

import com.uniminuto.clinica.entity.Usuario;
import com.uniminuto.clinica.exception.NoAutenticadoException;
import com.uniminuto.clinica.models.LoginRq;
import com.uniminuto.clinica.models.LoginRs;
import com.uniminuto.clinica.models.MenuRs;
import com.uniminuto.clinica.models.PerfilRs;
import com.uniminuto.clinica.repository.MedicoRepository;
import com.uniminuto.clinica.repository.PerfilMenuRepository;
import com.uniminuto.clinica.repository.UsuarioRepository;
import com.uniminuto.clinica.service.AuthService;
import com.uniminuto.clinica.util.ClaveSegura;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

/**
 * Implementación de la autenticación. Ante cualquier fallo responde el mismo
 * mensaje, para no revelar si el usuario existe o está inactivo.
 */
@Service
public class AuthServiceImpl implements AuthService {

    /**
     * Mensaje único para credenciales inválidas.
     */
    private static final String CREDENCIALES_INVALIDAS = "Usuario o contraseña incorrectos";

    /**
     * Hash de relleno: se verifica cuando el usuario no existe para que la
     * respuesta tarde lo mismo que con un usuario real.
     */
    private static final String HASH_RELLENO = ClaveSegura.generarHash("relleno-sin-uso-1");

    /**
     * Repositorio de usuarios.
     */
    @Autowired
    private UsuarioRepository usuarioRepository;

    /**
     * Repositorio de veterinarios.
     */
    @Autowired
    private MedicoRepository medicoRepository;

    /**
     * Repositorio de asignaciones de menú.
     */
    @Autowired
    private PerfilMenuRepository perfilMenuRepository;

    /**
     * Firma los tokens.
     */
    @Autowired
    private JwtEncoder codificadorJwt;

    /**
     * Horas de validez del token.
     */
    @Value("${clinica.jwt.horas-validez}")
    private long horasValidez;

    /**
     * {@inheritDoc}
     */
    @Override
    public LoginRs login(LoginRq rq) {
        if (rq == null || rq.getUsername() == null || rq.getPassword() == null) {
            throw new NoAutenticadoException(CREDENCIALES_INVALIDAS);
        }
        Usuario usuario = usuarioRepository.findByUsernameIgnoreCase(rq.getUsername().trim()).orElse(null);
        boolean claveCorrecta = ClaveSegura.verificar(rq.getPassword(),
                usuario == null ? HASH_RELLENO : usuario.getPasswordHash());
        if (usuario == null || !claveCorrecta || !Boolean.TRUE.equals(usuario.getActivo())
                || !Boolean.TRUE.equals(usuario.getPerfil().getActivo())) {
            throw new NoAutenticadoException(CREDENCIALES_INVALIDAS);
        }

        LoginRs rs = new LoginRs();
        rs.setToken(this.generarToken(usuario));
        rs.setPerfil(this.convertirAPerfil(usuario));
        return rs;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public PerfilRs perfilActual() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return this.convertirAPerfil(usuarioRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new NoAutenticadoException("Su sesión no es válida")));
    }

    /**
     * Genera el token firmado del usuario. Solo lleva su identidad: el rol se
     * consulta en la base de datos en cada petición.
     *
     * @param usuario usuario autenticado.
     * @return token JWT.
     */
    private String generarToken(Usuario usuario) {
        Instant ahora = Instant.now();
        JwtClaimsSet datos = JwtClaimsSet.builder()
                .issuer("clinica-veterinaria")
                .subject(usuario.getUsername())
                .issuedAt(ahora)
                .expiresAt(ahora.plus(horasValidez, ChronoUnit.HOURS))
                .build();
        return codificadorJwt.encode(JwtEncoderParameters.from(
                JwsHeader.with(MacAlgorithm.HS256).build(), datos)).getTokenValue();
    }

    /**
     * Arma el perfil del usuario con su veterinario enlazado, si lo tiene.
     *
     * @param usuario usuario.
     * @return perfil.
     */
    private PerfilRs convertirAPerfil(Usuario usuario) {
        PerfilRs perfil = new PerfilRs();
        perfil.setId(usuario.getId());
        perfil.setUsername(usuario.getUsername());
        perfil.setEmail(usuario.getEmail());
        perfil.setRol(usuario.getRol());
        perfil.setPerfilNombre(usuario.getPerfil().getNombre());
        perfil.setMenus(perfilMenuRepository.listarMenusActivos(usuario.getPerfil().getPerfilId()).stream()
                .map(menu -> {
                    MenuRs rs = new MenuRs();
                    rs.setMenuId(menu.getMenuId());
                    rs.setCode(menu.getCode());
                    rs.setTitle(menu.getTitle());
                    rs.setUrl(menu.getUrl());
                    rs.setIcon(menu.getIcon());
                    rs.setActivo(menu.getActivo());
                    return rs;
                }).toList());
        medicoRepository.findByUsuarioId(usuario.getId()).ifPresent(medico -> {
            perfil.setMedicoId(medico.getId());
            perfil.setMedicoNombre(medico.getNombres() + " " + medico.getApellidos());
        });
        return perfil;
    }
}
