package com.uniminuto.clinica.serviceimpl;

import com.uniminuto.clinica.entity.Menu;
import com.uniminuto.clinica.entity.Perfil;
import com.uniminuto.clinica.exception.BadRequestException;
import com.uniminuto.clinica.exception.ConflictException;
import com.uniminuto.clinica.exception.NotFoundException;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.PerfilMenusRq;
import com.uniminuto.clinica.models.PerfilRs;
import com.uniminuto.clinica.repository.MenuRepository;
import com.uniminuto.clinica.repository.PerfilRepository;
import com.uniminuto.clinica.repository.UsuarioRepository;
import com.uniminuto.clinica.security.Roles;
import com.uniminuto.clinica.service.PerfilService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * Administración de perfiles y de los menús que ve cada uno.
 * Los menús solo controlan la navegación: los permisos de cada servicio siguen en @RequiereRol.
 */
@Service
public class PerfilServiceImpl implements PerfilService {

    /** Menú sin el cual el administrador quedaría sin forma de volver a asignar permisos. */
    private static final String MENU_PERFILES = "perfiles";

    @Autowired
    private PerfilRepository perfilRepository;

    @Autowired
    private MenuRepository menuRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Override
    @Transactional(readOnly = true)
    public List<PerfilRs> listar() {
        return perfilRepository.findAllByOrderByNombreAsc().stream()
                .map(p -> new PerfilRs(p.getPerfilId(), p.getCodigo(), p.getNombre(), p.getActivo(),
                        usuarioRepository.countByPerfil_PerfilIdAndActivoTrue(p.getPerfilId()),
                        menuRepository.findIdsByPerfil(p.getPerfilId())))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Menu> listarMenus() {
        return menuRepository.findAllByOrderByOrdenAscTitleAsc();
    }

    @Override
    @Transactional
    public MiRespuestaRS asignarMenus(PerfilMenusRq rq) {
        if (rq == null || rq.getPerfilId() == null || rq.getMenuIds() == null) {
            throw new BadRequestException("Indique el perfil y la lista de menús.");
        }
        Perfil perfil = buscarPerfil(rq.getPerfilId());
        Set<Integer> ids = new LinkedHashSet<>(rq.getMenuIds());
        ids.remove(null);
        List<Menu> menus = menuRepository.findAllById(ids);
        if (menus.size() != ids.size()) {
            throw new NotFoundException("Uno o más menús no existen.");
        }
        if (Roles.ADMIN.equals(perfil.getCodigo())
                && menus.stream().noneMatch(m -> MENU_PERFILES.equals(m.getCode()))) {
            throw new ConflictException("El perfil Administrador debe conservar el menú de perfiles y permisos.");
        }
        menuRepository.quitarMenus(perfil.getPerfilId());
        ids.forEach(id -> menuRepository.asignarMenu(perfil.getPerfilId(), id));
        perfil.setFechaModificacion(LocalDateTime.now());
        perfilRepository.save(perfil);
        return MiRespuestaRS.ok("Menús del perfil " + perfil.getNombre() + " actualizados (" + ids.size() + ").",
                perfil.getPerfilId());
    }

    @Override
    @Transactional
    public MiRespuestaRS cambiarEstadoPerfil(Integer perfilId, boolean activo) {
        Perfil perfil = buscarPerfil(perfilId);
        if (!activo && Roles.ADMIN.equals(perfil.getCodigo())) {
            throw new ConflictException("El perfil Administrador no se puede inactivar.");
        }
        perfil.setActivo(activo);
        perfil.setFechaModificacion(LocalDateTime.now());
        perfilRepository.save(perfil);
        return MiRespuestaRS.ok("Perfil " + perfil.getNombre() + (activo ? " activado." : " inactivado. Sus usuarios no podrán ingresar."),
                perfil.getPerfilId());
    }

    @Override
    @Transactional
    public MiRespuestaRS cambiarEstadoMenu(Integer menuId, boolean activo) {
        Menu menu = menuRepository.findById(menuId == null ? -1 : menuId)
                .orElseThrow(() -> new NotFoundException("El menú no existe."));
        if (!activo && MENU_PERFILES.equals(menu.getCode())) {
            throw new ConflictException("El menú de perfiles y permisos no se puede inactivar.");
        }
        menu.setActivo(activo);
        menu.setFechaModificacion(LocalDateTime.now());
        menuRepository.save(menu);
        return MiRespuestaRS.ok("Menú '" + menu.getTitle() + "' " + (activo ? "activado." : "inactivado."), menu.getMenuId());
    }

    private Perfil buscarPerfil(Integer perfilId) {
        return perfilRepository.findById(perfilId == null ? -1 : perfilId)
                .orElseThrow(() -> new NotFoundException("El perfil no existe."));
    }
}
