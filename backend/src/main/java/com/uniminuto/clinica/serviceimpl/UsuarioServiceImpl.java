package com.uniminuto.clinica.serviceimpl;

import com.uniminuto.clinica.entity.Medico;
import com.uniminuto.clinica.entity.Perfil;
import com.uniminuto.clinica.entity.Usuario;
import com.uniminuto.clinica.exception.BadRequestException;
import com.uniminuto.clinica.exception.ConflictException;
import com.uniminuto.clinica.exception.NotFoundException;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.UsuarioRq;
import com.uniminuto.clinica.models.UsuarioRs;
import com.uniminuto.clinica.repository.MedicoRepository;
import com.uniminuto.clinica.repository.PerfilRepository;
import com.uniminuto.clinica.repository.UsuarioRepository;
import com.uniminuto.clinica.repository.UsuarioSesionRepository;
import com.uniminuto.clinica.security.ContextoUsuario;
import com.uniminuto.clinica.security.Roles;
import com.uniminuto.clinica.service.UsuarioService;
import com.uniminuto.clinica.utils.Validar;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class UsuarioServiceImpl implements UsuarioService {

    private static final String REGEX_USERNAME = "^[a-z0-9._-]{4,50}$";
    private static final String REGEX_PASSWORD = "^(?=.*[A-Za-z])(?=.*\\d).{8,72}$";

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PerfilRepository perfilRepository;

    @Autowired
    private MedicoRepository medicoRepository;

    @Autowired
    private UsuarioSesionRepository sesionRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    @Transactional(readOnly = true)
    public List<UsuarioRs> listar() {
        return usuarioRepository.findAllByOrderByNombreCompletoAsc().stream().map(UsuarioRs::de).toList();
    }

    @Override
    public List<Perfil> listarPerfiles() {
        return perfilRepository.findAllByOrderByNombreAsc();
    }

    @Override
    @Transactional
    public MiRespuestaRS guardar(UsuarioRq rq) {
        if (rq == null) {
            throw new BadRequestException("La información del usuario es obligatoria.");
        }
        String username = validarUsername(rq.getUsername());
        if (usuarioRepository.existsByUsername(username)) {
            throw new ConflictException("Ya existe un usuario con el nombre de usuario '" + username + "'.");
        }
        validarPassword(rq.getPassword());
        Usuario u = new Usuario();
        u.setUsername(username);
        u.setPasswordHash(passwordEncoder.encode(rq.getPassword()));
        mapear(u, rq, null);
        u.setActivo(Boolean.TRUE);
        u.setFechaCreacion(LocalDateTime.now());
        usuarioRepository.save(u);
        return MiRespuestaRS.creado("Usuario creado correctamente.", u.getUsuarioId());
    }

    @Override
    @Transactional
    public MiRespuestaRS actualizar(UsuarioRq rq) {
        if (rq == null) {
            throw new BadRequestException("La información del usuario es obligatoria.");
        }
        Validar.idValido(rq.getUsuarioId(), "usuarioId");
        Usuario u = usuarioRepository.findById(rq.getUsuarioId())
                .orElseThrow(() -> new NotFoundException("El usuario no existe."));
        String username = validarUsername(rq.getUsername());
        if (usuarioRepository.existsByUsernameAndUsuarioIdNot(username, u.getUsuarioId())) {
            throw new ConflictException("Ya existe otro usuario con el nombre de usuario '" + username + "'.");
        }
        u.setUsername(username);
        if (!Validar.vacio(rq.getPassword())) {
            validarPassword(rq.getPassword());
            u.setPasswordHash(passwordEncoder.encode(rq.getPassword()));
            sesionRepository.cerrarSesionesUsuario(u.getUsuarioId());
        }
        mapear(u, rq, u.getUsuarioId());
        u.setFechaModificacion(LocalDateTime.now());
        usuarioRepository.save(u);
        return MiRespuestaRS.ok("Usuario actualizado correctamente.", u.getUsuarioId());
    }

    @Override
    @Transactional
    public MiRespuestaRS cambiarEstado(Integer usuarioId, boolean activo) {
        Validar.idValido(usuarioId, "usuarioId");
        if (!activo && usuarioId.equals(ContextoUsuario.obtener().usuarioId())) {
            throw new ConflictException("No puede inactivar su propio usuario.");
        }
        Usuario u = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new NotFoundException("El usuario no existe."));
        u.setActivo(activo);
        u.setFechaModificacion(LocalDateTime.now());
        usuarioRepository.save(u);
        if (!activo) {
            sesionRepository.cerrarSesionesUsuario(usuarioId);
        }
        return MiRespuestaRS.ok(activo ? "Usuario activado." : "Usuario inactivado y sesiones cerradas.", usuarioId);
    }

    private void mapear(Usuario u, UsuarioRq rq, Integer idActual) {
        u.setNombreCompleto(Validar.texto(rq.getNombreCompleto(), "nombre completo", 150));
        String email = Validar.textoOpcional(rq.getEmail(), "email", 150);
        if (email != null && !email.matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")) {
            throw new BadRequestException("El correo electrónico no es válido.");
        }
        u.setEmail(email);
        Validar.idValido(rq.getPerfilId(), "perfilId");
        Perfil perfil = perfilRepository.findById(rq.getPerfilId())
                .orElseThrow(() -> new NotFoundException("El perfil no existe."));
        u.setPerfil(perfil);
        if (Roles.MEDICO.equals(perfil.getCodigo())) {
            Validar.idValido(rq.getMedicoId(), "médico asociado");
            Medico medico = medicoRepository.findById(rq.getMedicoId())
                    .orElseThrow(() -> new NotFoundException("El veterinario no existe."));
            boolean asignado = idActual == null
                    ? usuarioRepository.existsByMedico_Id(medico.getId())
                    : usuarioRepository.existsByMedico_IdAndUsuarioIdNot(medico.getId(), idActual);
            if (asignado) {
                throw new ConflictException("El veterinario ya tiene un usuario asignado.");
            }
            u.setMedico(medico);
        } else {
            u.setMedico(null);
        }
    }

    private String validarUsername(String username) {
        if (Validar.vacio(username) || !username.trim().toLowerCase().matches(REGEX_USERNAME)) {
            throw new BadRequestException("El nombre de usuario debe tener entre 4 y 50 caracteres "
                    + "(letras minúsculas, números, punto, guion o guion bajo).");
        }
        return username.trim().toLowerCase();
    }

    private void validarPassword(String password) {
        if (password == null || !password.matches(REGEX_PASSWORD)) {
            throw new BadRequestException("La contraseña debe tener mínimo 8 caracteres, con al menos una letra y un número.");
        }
    }
}
