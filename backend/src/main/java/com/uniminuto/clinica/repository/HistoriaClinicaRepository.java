package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.dto.HistoriaClinicaDTO;
import com.uniminuto.clinica.dto.AnotacionHistoriaDTO;
import java.sql.Timestamp;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

/** Persistencia de historias clínicas y anotaciones del histórico. */
@Repository
public class HistoriaClinicaRepository {
    private final JdbcTemplate jdbc;
    private final RowMapper<HistoriaClinicaDTO> historiaMapper = (rs, row) -> new HistoriaClinicaDTO(
        rs.getLong("id"), rs.getLong("cliente_id"), rs.getString("cliente_nombre"), rs.getLong("paciente_id"),
        rs.getString("mascota_nombre"), rs.getObject("cita_id") == null ? null : rs.getLong("cita_id"),
        rs.getObject("medico_id") == null ? null : rs.getLong("medico_id"), rs.getString("medico_nombre"),
        rs.getTimestamp("fecha_hora") == null ? (rs.getTimestamp("fecha_creacion") == null ? null : rs.getTimestamp("fecha_creacion").toLocalDateTime()) : rs.getTimestamp("fecha_hora").toLocalDateTime(),
        rs.getTimestamp("fecha_creacion") == null ? null : rs.getTimestamp("fecha_creacion").toLocalDateTime(),
        rs.getString("motivo_consulta"), rs.getString("diagnostico"), rs.getString("observaciones"));
    private final RowMapper<AnotacionHistoriaDTO> anotacionMapper = (rs,row) -> new AnotacionHistoriaDTO(
        rs.getLong("id"), rs.getLong("historia_id"), rs.getLong("medico_id"), rs.getString("medico_nombre"),
        rs.getTimestamp("fecha").toLocalDateTime(), rs.getString("descripcion"), rs.getString("observacion"), rs.getString("diagnostico"));
    private static final String SELECT_HISTORIAS = "SELECT h.id,h.paciente_id,p.cliente_id,CONCAT(cl.nombres,' ',cl.apellidos) AS cliente_nombre,p.nombre_mascota AS mascota_nombre,h.cita_id,c.medico_id,CONCAT(md.nombres,' ',md.apellidos) AS medico_nombre,COALESCE(h.fecha_hora,c.fecha_hora) AS fecha_hora,h.fecha_creacion,h.motivo_consulta,h.diagnostico,h.observaciones FROM historia_medica h LEFT JOIN mascota p ON p.mascota_id=h.paciente_id LEFT JOIN cliente cl ON cl.cliente_id=p.cliente_id LEFT JOIN cita c ON c.id=h.cita_id LEFT JOIN medico md ON md.id=COALESCE(h.medico_id,c.medico_id)";

    /** Inyecta el acceso SQL. */
    public HistoriaClinicaRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    /** Lista historias, opcionalmente filtradas por fecha de consulta. */
    public List<HistoriaClinicaDTO> listar(LocalDate desde, LocalDate hasta) {
        StringBuilder sql=new StringBuilder(SELECT_HISTORIAS).append(" WHERE 1=1"); List<Object> args=new ArrayList<>();
        if(desde!=null){sql.append(" AND COALESCE(h.fecha_hora,c.fecha_hora,h.fecha_creacion)>=?");args.add(Timestamp.valueOf(desde.atStartOfDay()));}
        if(hasta!=null){sql.append(" AND COALESCE(h.fecha_hora,c.fecha_hora,h.fecha_creacion)<?");args.add(Timestamp.valueOf(hasta.plusDays(1).atStartOfDay()));}
        sql.append(" ORDER BY COALESCE(h.fecha_hora,c.fecha_hora,h.fecha_creacion) DESC,h.id DESC");
        return jdbc.query(sql.toString(),historiaMapper,args.toArray());
    }

    /** Recupera una historia clínica individual. */
    public HistoriaClinicaDTO obtener(Long id) { return jdbc.query(SELECT_HISTORIAS+" WHERE h.id=?",historiaMapper,id).stream().findFirst().orElse(null); }

    /** Devuelve la fecha y el veterinario asociados a la historia. */
    public HistoriaClinicaDTO obtenerPorCita(Long citaId) { return jdbc.query(SELECT_HISTORIAS+" WHERE h.cita_id=?",historiaMapper,citaId).stream().findFirst().orElse(null); }

    /** Comprueba si una cita ya tiene historia clínica. */
    public boolean existePorCita(Long citaId) { return jdbc.queryForObject("SELECT COUNT(*) FROM historia_medica WHERE cita_id=?", Integer.class, citaId) > 0; }

    /** Inserta una historia y devuelve su ID. */
    public Long insertar(Long mascotaId, Long citaId, Long medicoId, String motivo, String diagnostico, String observaciones) {
        KeyHolder key=new GeneratedKeyHolder();
        jdbc.update(connection->{PreparedStatement ps=connection.prepareStatement("INSERT INTO historia_medica(paciente_id,fecha_creacion,cita_id,medico_id,fecha_hora,motivo_consulta,diagnostico,observaciones) VALUES(?,CURRENT_TIMESTAMP,?, ?, (SELECT fecha_hora FROM cita WHERE id=?),?,?,?)",Statement.RETURN_GENERATED_KEYS);ps.setLong(1,mascotaId);ps.setLong(2,citaId);ps.setLong(3,medicoId);ps.setLong(4,citaId);ps.setString(5,motivo);ps.setString(6,diagnostico);ps.setString(7,observaciones);return ps;},key);
        return key.getKey().longValue();
    }

    /** Lista las anotaciones de una historia por fecha descendente. */
    public List<AnotacionHistoriaDTO> listarAnotaciones(Long historiaId) {
        return jdbc.query("SELECT a.id,a.historia_id,a.medico_id,CONCAT(m.nombres,' ',m.apellidos) AS medico_nombre,a.fecha,a.descripcion,a.observacion,a.diagnostico FROM anotacion_historia a LEFT JOIN medico m ON m.id=a.medico_id WHERE a.historia_id=? ORDER BY a.fecha DESC,a.id DESC",anotacionMapper,historiaId);
    }

    /** Lista todas las anotaciones con filtros de fecha. */
    public List<AnotacionHistoriaDTO> listarTodasAnotaciones(LocalDate desde, LocalDate hasta) {
        StringBuilder sql=new StringBuilder("SELECT a.id,a.historia_id,a.medico_id,CONCAT(m.nombres,' ',m.apellidos) AS medico_nombre,a.fecha,a.descripcion,a.observacion,a.diagnostico FROM anotacion_historia a LEFT JOIN medico m ON m.id=a.medico_id WHERE 1=1"); List<Object> args=new ArrayList<>();
        if(desde!=null){sql.append(" AND a.fecha>=?");args.add(Timestamp.valueOf(desde.atStartOfDay()));}
        if(hasta!=null){sql.append(" AND a.fecha<?");args.add(Timestamp.valueOf(hasta.plusDays(1).atStartOfDay()));}
        sql.append(" ORDER BY a.fecha DESC,a.id DESC");return jdbc.query(sql.toString(),anotacionMapper,args.toArray());
    }

    /** Busca una anotación por ID. */
    public AnotacionHistoriaDTO obtenerAnotacion(Long id) {
        return jdbc.query("SELECT a.id,a.historia_id,a.medico_id,CONCAT(m.nombres,' ',m.apellidos) AS medico_nombre,a.fecha,a.descripcion,a.observacion,a.diagnostico FROM anotacion_historia a LEFT JOIN medico m ON m.id=a.medico_id WHERE a.id=?",anotacionMapper,id).stream().findFirst().orElse(null);
    }

    /** Inserta una anotación clínica y devuelve su identificador. */
    public Long insertarAnotacion(Long historiaId, Long medicoId, java.time.LocalDateTime fecha, String descripcion, String observacion, String diagnostico) {
        KeyHolder key=new GeneratedKeyHolder();
        jdbc.update(connection->{PreparedStatement ps=connection.prepareStatement("INSERT INTO anotacion_historia(historia_id,medico_id,fecha,descripcion,observacion,diagnostico) VALUES(?,?,?,?,?,?)",Statement.RETURN_GENERATED_KEYS);ps.setLong(1,historiaId);ps.setLong(2,medicoId);ps.setTimestamp(3,Timestamp.valueOf(fecha));ps.setString(4,descripcion);ps.setString(5,observacion);ps.setString(6,diagnostico);return ps;},key);return key.getKey().longValue();
    }

    /** Actualiza el contenido de una anotación existente. */
    public void actualizarAnotacion(Long id, Long historiaId, Long medicoId, java.time.LocalDateTime fecha, String descripcion, String observacion, String diagnostico) {
        jdbc.update("UPDATE anotacion_historia SET historia_id=?,medico_id=?,fecha=?,descripcion=?,observacion=?,diagnostico=? WHERE id=?",historiaId,medicoId,Timestamp.valueOf(fecha),descripcion,observacion,diagnostico,id);
    }
}
