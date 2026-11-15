package com.uniminuto.clinica.serviceimpl;

import com.uniminuto.clinica.entity.Menu;
import com.uniminuto.clinica.entity.Perfil;
import com.uniminuto.clinica.entity.PerfilMenu;
import com.uniminuto.clinica.exception.BadRequestException;
import com.uniminuto.clinica.exception.ConflictException;
import com.uniminuto.clinica.exception.NotFoundException;
import com.uniminuto.clinica.models.MenuRs;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.PerfilMenusRq;
import com.uniminuto.clinica.models.PerfilMenusRs;
import com.uniminuto.clinica.repository.MenuRepository;
import com.uniminuto.clinica.repository.PerfilMenuRepository;
import com.uniminuto.clinica.repository.PerfilRepository;
import com.uniminuto.clinica.repository.UsuarioRepository;
import com.uniminuto.clinica.service.PerfilService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Implementación de la administración de perfiles y menús. Las opciones
 * definen lo que cada perfil ve en la aplicación; los permisos sobre los
 * servicios siguen validándose por separado en SeguridadConfig. Se impide
 * cualquier cambio que deje al sistema sin quien pueda administrarlo.
 */
@Service
public class PerfilServiceImpl implements PerfilService {

    /**
     * Código del perfil administrador.
     */
    private static final String PERFIL_ADMIN = "ADMIN";

    /**
     * Opciones que el administrador nunca puede perder.
     */
    private static final Set<String> MENUS_PROTEGIDOS = Set.of("usuarios", "perfiles");

    /**
     * Repositorio de perfiles.
     */
    @Autowired
    private PerfilRepository perfilRepository;

    /**
     * Repositorio de opciones de menú.
     */
    @Autowired
    private MenuRepository menuRepository;

    /**
     * Repositorio de asignaciones.
     */
    @Autowired
    private PerfilMenuRepository perfilMenuRepository;

    /**
     * Repositorio de usuarios.
     */
    @Autowired
    private UsuarioRepository usuarioRepository;

    /**
     * {@inheritDoc}
     */
    @Override
    public List<PerfilMenusRs> listarPerfiles() {
        Map<Integer, List<Integer>> asignados = perfilMenuRepository.findAll().stream()
                .collect(Collectors.groupingBy(pm -> pm.getPerfil().getPerfilId(),
                        Collectors.mapping(pm -> pm.getMenu().getMenuId(), Collectors.toList())));
        return perfilRepository.findAll(Sort.by("perfilId")).stream().map(perfil -> {
            PerfilMenusRs rs = new PerfilMenusRs();
            rs.setPerfilId(perfil.getPerfilId());
            rs.setCodigo(perfil.getCodigo());
            rs.setNombre(perfil.getNombre());
            rs.setActivo(perfil.getActivo());
            rs.setTotalUsuarios(usuarioRepository.countByPerfil_PerfilId(perfil.getPerfilId()));
            rs.setMenuIds(asignados.getOrDefault(perfil.getPerfilId(), List.of()));
            return rs;
        }).toList();
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public List<MenuRs> listarMenus() {
        return menuRepository.findAll(Sort.by("title")).stream().map(menu -> {
            MenuRs rs = new MenuRs();
            rs.setMenuId(menu.getMenuId());
            rs.setCode(menu.getCode());
            rs.setTitle(menu.getTitle());
            rs.setUrl(menu.getUrl());
            rs.setIcon(menu.getIcon());
            rs.setActivo(menu.getActivo());
            return rs;
        }).toList();
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public MiRespuestaRS actualizarMenus(Integer perfilId, PerfilMenusRq rq) {
        if (rq == null || rq.getMenuIds() == null) {
            throw new BadRequestException("Debe enviar las opciones de menú del perfil");
        }
        Perfil perfil = this.buscarPerfil(perfilId);
        Set<Integer> solicitados = new HashSet<>(rq.getMenuIds());
        List<Menu> menus = menuRepository.findAllById(solicitados);
        if (menus.size() != solicitados.size()) {
            throw new NotFoundException("Alguna de las opciones de menú no existe");
        }
        if (PERFIL_ADMIN.equals(perfil.getCodigo()) && !menus.stream().map(Menu::getCode)
                .collect(Collectors.toSet()).containsAll(MENUS_PROTEGIDOS)) {
            throw new ConflictException("El administrador debe conservar los menús de usuarios y perfiles");
        }

        // Solo se aplican las diferencias, para no violar la unicidad al reinsertar.
        List<PerfilMenu> actuales = perfilMenuRepository.findByPerfil_PerfilId(perfilId);
        Set<Integer> existentes = actuales.stream().map(pm -> pm.getMenu().getMenuId()).collect(Collectors.toSet());
        perfilMenuRepository.deleteAll(actuales.stream()
                .filter(pm -> !solicitados.contains(pm.getMenu().getMenuId())).toList());
        perfilMenuRepository.saveAll(menus.stream()
                .filter(menu -> !existentes.contains(menu.getMenuId()))
                .map(menu -> {
                    PerfilMenu asignacion = new PerfilMenu();
                    asignacion.setPerfil(perfil);
                    asignacion.setMenu(menu);
                    return asignacion;
                }).toList());

        perfil.setFechaModificacion(LocalDateTime.now());
        perfilRepository.save(perfil);
        return MiRespuestaRS.de(200, "Menús del perfil " + perfil.getNombre() + " actualizados");
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public MiRespuestaRS cambiarEstadoPerfil(Integer perfilId, boolean activar) {
        Perfil perfil = this.buscarPerfil(perfilId);
        if (Boolean.valueOf(activar).equals(perfil.getActivo())) {
            throw new ConflictException(activar ? "El perfil ya está activo" : "El perfil ya está inactivo");
        }
        if (!activar && PERFIL_ADMIN.equals(perfil.getCodigo())) {
            throw new ConflictException("El perfil de administrador no se puede inactivar");
        }
        perfil.setActivo(activar);
        perfil.setFechaModificacion(LocalDateTime.now());
        perfilRepository.save(perfil);
        return MiRespuestaRS.de(200, activar ? "Perfil activado correctamente" : "Perfil inactivado correctamente");
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public MiRespuestaRS cambiarEstadoMenu(Integer menuId, boolean activar) {
        Menu menu = menuRepository.findById(menuId)
                .orElseThrow(() -> new NotFoundException("La opción de menú no existe"));
        if (Boolean.valueOf(activar).equals(menu.getActivo())) {
            throw new ConflictException(activar ? "La opción ya está activa" : "La opción ya está inactiva");
        }
        if (!activar && MENUS_PROTEGIDOS.contains(menu.getCode())) {
            throw new ConflictException("Los menús de usuarios y perfiles no se pueden inactivar");
        }
        menu.setActivo(activar);
        menu.setFechaModificacion(LocalDateTime.now());
        menuRepository.save(menu);
        return MiRespuestaRS.de(200, activar ? "Opción de menú activada" : "Opción de menú inactivada");
    }

    /**
     * Busca un perfil por su identificador.
     *
     * @param perfilId identificador.
     * @return el perfil.
     */
    private Perfil buscarPerfil(Integer perfilId) {
        return perfilRepository.findById(perfilId)
                .orElseThrow(() -> new NotFoundException("El perfil no existe"));
    }
}
