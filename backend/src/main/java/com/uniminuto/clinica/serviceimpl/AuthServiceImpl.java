package com.uniminuto.clinica.serviceimpl;

import com.uniminuto.clinica.entity.Usuario;
import com.uniminuto.clinica.entity.UsuarioSesion;
import com.uniminuto.clinica.exception.BadRequestException;
import com.uniminuto.clinica.exception.ForbiddenException;
import com.uniminuto.clinica.exception.UnauthorizedException;
import com.uniminuto.clinica.models.LoginRq;
import com.uniminuto.clinica.models.SesionRs;
import com.uniminuto.clinica.models.UsuarioRs;
import com.uniminuto.clinica.repository.MenuRepository;
import com.uniminuto.clinica.repository.UsuarioRepository;
import com.uniminuto.clinica.repository.UsuarioSesionRepository;
import com.uniminuto.clinica.security.ContextoUsuario;
import com.uniminuto.clinica.security.Roles;
import com.uniminuto.clinica.security.UsuarioActual;
import com.uniminuto.clinica.service.AuthService;
import com.uniminuto.clinica.utils.Validar;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HexFormat;

@Service
public class AuthServiceImpl implements AuthService {

    private static final String CREDENCIALES_INVALIDAS = "Usuario o contraseña incorrectos.";

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private UsuarioSesionRepository sesionRepository;

    @Autowired
    private MenuRepository menuRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Value("${clinica.seguridad.horas-sesion:10}")
    private long horasSesion;

    private final SecureRandom random = new SecureRandom();

    @Override
    @Transactional
    public SesionRs login(LoginRq rq) {
        if (rq == null || Validar.vacio(rq.getUsername()) || Validar.vacio(rq.getPassword())) {
            throw new BadRequestException("El usuario y la contraseña son obligatorios.");
        }
        Usuario usuario = usuarioRepository.findByUsername(rq.getUsername().trim().toLowerCase())
                .orElseThrow(() -> new UnauthorizedException(CREDENCIALES_INVALIDAS));
        if (!passwordEncoder.matches(rq.getPassword(), usuario.getPasswordHash())) {
            throw new UnauthorizedException(CREDENCIALES_INVALIDAS);
        }
        if (!Boolean.TRUE.equals(usuario.getActivo()) || !Boolean.TRUE.equals(usuario.getPerfil().getActivo())) {
            throw new ForbiddenException("El usuario o su perfil están inactivos.");
        }
        if (Roles.MEDICO.equals(usuario.getPerfil().getCodigo())
                && (usuario.getMedico() == null || !Boolean.TRUE.equals(usuario.getMedico().getEstado()))) {
            throw new ForbiddenException("El veterinario asociado al usuario está inactivo.");
        }
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        LocalDateTime ahora = LocalDateTime.now();

        UsuarioSesion sesion = new UsuarioSesion();
        sesion.setToken(HexFormat.of().formatHex(bytes));
        sesion.setUsuario(usuario);
        sesion.setFechaCreacion(ahora);
        sesion.setFechaExpiracion(ahora.plusHours(horasSesion));
        sesion.setActivo(Boolean.TRUE);
        sesionRepository.save(sesion);

        usuario.setUltimoAcceso(ahora);
        usuarioRepository.save(usuario);

        return new SesionRs(sesion.getToken(), sesion.getFechaExpiracion(), UsuarioRs.de(usuario),
                menuRepository.findByPerfil(usuario.getPerfil().getPerfilId()));
    }

    @Override
    @Transactional
    public void logout(String token) {
        if (token != null) {
            sesionRepository.findById(token).ifPresent(s -> {
                s.setActivo(Boolean.FALSE);
                sesionRepository.save(s);
            });
        }
    }

    @Override
    @Transactional(readOnly = true)
    public SesionRs sesionActual() {
        Usuario usuario = usuarioActual();
        return new SesionRs(null, null, UsuarioRs.de(usuario),
                menuRepository.findByPerfil(usuario.getPerfil().getPerfilId()));
    }

    @Override
    @Transactional(readOnly = true)
    public UsuarioActual validarToken(String token) {
        if (Validar.vacio(token)) {
            throw new UnauthorizedException("Debe iniciar sesión para usar este servicio.");
        }
        UsuarioSesion sesion = sesionRepository.findById(token)
                .orElseThrow(() -> new UnauthorizedException("La sesión no es válida. Inicie sesión nuevamente."));
        if (!Boolean.TRUE.equals(sesion.getActivo()) || sesion.getFechaExpiracion().isBefore(LocalDateTime.now())) {
            throw new UnauthorizedException("La sesión expiró. Inicie sesión nuevamente.");
        }
        Usuario u = sesion.getUsuario();
        if (!Boolean.TRUE.equals(u.getActivo())) {
            throw new UnauthorizedException("El usuario está inactivo.");
        }
        if (!Boolean.TRUE.equals(u.getPerfil().getActivo())) {
            throw new UnauthorizedException("El perfil del usuario fue inactivado.");
        }
        return new UsuarioActual(u.getUsuarioId(), u.getUsername(), u.getNombreCompleto(),
                u.getPerfil().getCodigo(), u.getPerfil().getNombre(),
                u.getMedico() == null ? null : u.getMedico().getId());
    }

    @Override
    @Transactional(readOnly = true)
    public Usuario usuarioActual() {
        Integer id = ContextoUsuario.obtener().usuarioId();
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new UnauthorizedException("El usuario de la sesión no existe."));
    }
}
