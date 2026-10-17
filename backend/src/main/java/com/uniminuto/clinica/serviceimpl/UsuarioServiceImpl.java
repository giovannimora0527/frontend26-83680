package com.uniminuto.clinica.serviceimpl;

import com.uniminuto.clinica.entity.Usuario;
import com.uniminuto.clinica.exception.BadRequestException;
import com.uniminuto.clinica.exception.ConflictException;
import com.uniminuto.clinica.exception.NotFoundException;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.UsuarioRq;
import com.uniminuto.clinica.models.UsuarioRs;
import com.uniminuto.clinica.repository.UsuarioRepository;
import com.uniminuto.clinica.service.UsuarioService;
import com.uniminuto.clinica.util.ClaveSegura;
import com.uniminuto.clinica.util.Validaciones;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.regex.Pattern;

/**
 * Implementación de las reglas de negocio de los usuarios:
 * nombre de usuario y correo únicos, contraseña de al menos 8 caracteres con
 * letras y números (guardada como hash), roles válidos, no se eliminan (se
 * inactivan) y el sistema nunca queda sin un administrador activo.
 */
@Service
public class UsuarioServiceImpl implements UsuarioService {

    /**
     * Rol de administrador.
     */
    private static final String ROL_ADMIN = "ADMIN";

    /**
     * Roles aceptados.
     */
    private static final List<String> ROLES = List.of(ROL_ADMIN, "VETERINARIO", "RECEPCIONISTA", "CLIENTE");

    /**
     * Nombre de usuario: 4 a 30 letras, números, punto, guion o guion bajo.
     */
    private static final Pattern USERNAME = Pattern.compile("^[A-Za-z0-9._-]{4,30}$");

    /**
     * Correo electrónico con formato básico válido.
     */
    private static final Pattern EMAIL = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");

    /**
     * Identificador que no existe, para reutilizar las consultas "IdNot" al crear.
     */
    private static final Integer SIN_ID = -1;

    /**
     * Repositorio de usuarios.
     */
    @Autowired
    private UsuarioRepository usuarioRepository;

    /**
     * {@inheritDoc}
     */
    @Override
    public List<UsuarioRs> listarUsuarios() {
        return usuarioRepository.findAll(Sort.by("username")).stream().map(this::convertirARespuesta).toList();
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public UsuarioRs consultarUsuario(Integer id) {
        return this.convertirARespuesta(this.buscar(id));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public MiRespuestaRS guardarUsuario(UsuarioRq rq) {
        Usuario usuario = new Usuario();
        this.aplicarDatos(usuario, rq, SIN_ID);
        if (rq.getPassword() == null || rq.getPassword().isEmpty()) {
            throw new BadRequestException("La contraseña es obligatoria");
        }
        usuario.setPasswordHash(ClaveSegura.generarHash(this.validarClave(rq.getPassword())));
        usuario.setActivo(true);
        usuario.setFechaCreacion(LocalDateTime.now());
        usuarioRepository.save(usuario);
        return MiRespuestaRS.de(201, "Usuario registrado correctamente");
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public MiRespuestaRS actualizarUsuario(Integer id, UsuarioRq rq) {
        Usuario usuario = this.buscar(id);
        if (!Boolean.TRUE.equals(usuario.getActivo())) {
            throw new ConflictException("El usuario está inactivo; actívelo antes de modificarlo");
        }
        String rolAnterior = usuario.getRol();
        this.aplicarDatos(usuario, rq, id);
        if (ROL_ADMIN.equals(rolAnterior) && !ROL_ADMIN.equals(usuario.getRol())) {
            this.validarQueQuedeAdministrador();
        }
        if (rq.getPassword() != null && !rq.getPassword().isEmpty()) {
            usuario.setPasswordHash(ClaveSegura.generarHash(this.validarClave(rq.getPassword())));
        }
        usuario.setFechaModificacion(LocalDateTime.now());
        usuarioRepository.save(usuario);
        return MiRespuestaRS.de(200, "Usuario actualizado correctamente");
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public MiRespuestaRS cambiarEstado(Integer id, boolean activar) {
        Usuario usuario = this.buscar(id);
        if (Boolean.valueOf(activar).equals(usuario.getActivo())) {
            throw new ConflictException(activar ? "El usuario ya está activo" : "El usuario ya está inactivo");
        }
        if (!activar && ROL_ADMIN.equals(usuario.getRol())) {
            this.validarQueQuedeAdministrador();
        }
        usuario.setActivo(activar);
        usuario.setFechaModificacion(LocalDateTime.now());
        usuarioRepository.save(usuario);
        return MiRespuestaRS.de(200, activar ? "Usuario activado correctamente" : "Usuario inactivado correctamente");
    }

    /**
     * Valida nombre de usuario, correo y rol (incluida la unicidad) y los copia al usuario.
     *
     * @param usuario usuario a completar.
     * @param rq      datos recibidos.
     * @param id      usuario que se edita (SIN_ID al crear).
     */
    private void aplicarDatos(Usuario usuario, UsuarioRq rq, Integer id) {
        if (rq == null) {
            throw new BadRequestException("Debe enviar los datos del usuario");
        }
        String username = Validaciones.conPatron(rq.getUsername(), "El nombre de usuario", 30, USERNAME,
                "El nombre de usuario debe tener de 4 a 30 letras, números, punto, guion o guion bajo");
        String email = Validaciones.conPatron(rq.getEmail(), "El correo", 120, EMAIL,
                "El correo electrónico no es válido").toLowerCase();
        String rol = Validaciones.obligatorio(rq.getRol(), "El rol", 20).toUpperCase();
        if (!ROLES.contains(rol)) {
            throw new BadRequestException("El rol no es válido. Use: " + String.join(", ", ROLES));
        }
        if (usuarioRepository.existsByUsernameIgnoreCaseAndIdNot(username, id)) {
            throw new ConflictException("El nombre de usuario " + username + " ya existe");
        }
        if (usuarioRepository.existsByEmailIgnoreCaseAndIdNot(email, id)) {
            throw new ConflictException("El correo " + email + " ya está registrado");
        }
        usuario.setUsername(username);
        usuario.setEmail(email);
        usuario.setRol(rol);
    }

    /**
     * Valida la política de contraseñas.
     *
     * @param clave contraseña recibida.
     * @return la misma contraseña si es válida.
     */
    private String validarClave(String clave) {
        if (clave.length() < 8 || clave.length() > 64
                || !clave.matches(".*[A-Za-z].*") || !clave.matches(".*\\d.*")) {
            throw new BadRequestException("La contraseña debe tener entre 8 y 64 caracteres, con letras y números");
        }
        return clave;
    }

    /**
     * Impide dejar el sistema sin administradores activos.
     */
    private void validarQueQuedeAdministrador() {
        if (usuarioRepository.countByRolAndActivo(ROL_ADMIN, true) <= 1) {
            throw new ConflictException("Debe quedar al menos un administrador activo en el sistema");
        }
    }

    /**
     * Busca un usuario por su identificador.
     *
     * @param id identificador.
     * @return el usuario.
     */
    private Usuario buscar(Integer id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("El usuario no existe"));
    }

    /**
     * Convierte un usuario en la respuesta para el frontend (sin la contraseña).
     *
     * @param usuario usuario a convertir.
     * @return respuesta.
     */
    private UsuarioRs convertirARespuesta(Usuario usuario) {
        UsuarioRs rs = new UsuarioRs();
        rs.setId(usuario.getId());
        rs.setUsername(usuario.getUsername());
        rs.setEmail(usuario.getEmail());
        rs.setRol(usuario.getRol());
        rs.setActivo(usuario.getActivo());
        rs.setFechaCreacion(usuario.getFechaCreacion());
        return rs;
    }
}
