package com.uniminuto.clinica.config;

import com.uniminuto.clinica.entity.Medico;
import com.uniminuto.clinica.entity.Usuario;
import com.uniminuto.clinica.repository.MedicoRepository;
import com.uniminuto.clinica.repository.PerfilRepository;
import com.uniminuto.clinica.repository.UsuarioRepository;
import com.uniminuto.clinica.util.ClaveSegura;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * Crea, solo en el perfil de desarrollo, un usuario de prueba por cada rol si
 * todavía no existe, y enlaza el veterinario de prueba con el primer médico
 * que no tenga usuario. Las claves están en application-dev.properties.
 */
@Component
@Profile("dev")
public class DatosPruebaRunner implements CommandLineRunner {

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
     * Repositorio de perfiles.
     */
    @Autowired
    private PerfilRepository perfilRepository;

    /**
     * Clave de prueba del administrador.
     */
    @Value("${clinica.prueba.clave-admin}")
    private String claveAdmin;

    /**
     * Clave de prueba de la secretaria.
     */
    @Value("${clinica.prueba.clave-secretaria}")
    private String claveSecretaria;

    /**
     * Clave de prueba del veterinario.
     */
    @Value("${clinica.prueba.clave-veterinario}")
    private String claveVeterinario;

    /**
     * Clave de prueba del personal de despacho.
     */
    @Value("${clinica.prueba.clave-despacho}")
    private String claveDespacho;

    /**
     * {@inheritDoc}
     */
    @Override
    public void run(String... args) {
        this.crearSiNoExiste("admin", "admin@clinica.test", "ADMIN", claveAdmin);
        this.crearSiNoExiste("secretaria", "secretaria@clinica.test", "RECEPCIONISTA", claveSecretaria);
        this.crearSiNoExiste("despacho", "despacho@clinica.test", "DESPACHO_MEDICO", claveDespacho);
        Usuario veterinario = this.crearSiNoExiste(
                "veterinario", "veterinario@clinica.test", "VETERINARIO", claveVeterinario);

        if (medicoRepository.findByUsuarioId(veterinario.getId()).isEmpty()) {
            medicoRepository.findFirstByUsuarioIdIsNullOrderByIdAsc().ifPresent((Medico medico) -> {
                medico.setUsuarioId(veterinario.getId());
                medicoRepository.save(medico);
            });
        }
    }

    /**
     * Devuelve el usuario indicado, creándolo si no existe.
     *
     * @param username nombre de usuario.
     * @param email    correo.
     * @param rol      rol.
     * @param clave    clave de prueba.
     * @return el usuario.
     */
    private Usuario crearSiNoExiste(String username, String email, String rol, String clave) {
        return usuarioRepository.findByUsernameIgnoreCase(username).orElseGet(() -> {
            Usuario usuario = new Usuario();
            usuario.setUsername(username);
            usuario.setEmail(email);
            usuario.setPerfil(perfilRepository.findByCodigo(rol).orElseThrow());
            usuario.setPasswordHash(ClaveSegura.generarHash(clave));
            usuario.setActivo(true);
            usuario.setFechaCreacion(LocalDateTime.now());
            return usuarioRepository.save(usuario);
        });
    }
}
