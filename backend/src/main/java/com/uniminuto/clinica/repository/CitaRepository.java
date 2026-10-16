package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.dto.CitaCoreDTO;
import com.uniminuto.clinica.dto.CitaDTO;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;
import java.sql.PreparedStatement;
import java.sql.Statement;

/** Persistencia de citas y comprobaciones de disponibilidad de agenda. */
@Repository
public class CitaRepository {
    private final JdbcTemplate jdbc;
    private final RowMapper<CitaDTO> mapper = (rs, row) -> new CitaDTO(
        rs.getLong("id"), rs.getLong("cliente_id"), rs.getString("cliente_nombre"),
        rs.getLong("mascota_id"), rs.getString("mascota_nombre"), rs.getLong("medico_id"),
        rs.getString("medico_nombre"), rs.getTimestamp("fecha_hora").toLocalDateTime(),
        rs.getString("estado"), rs.getString("motivo"));
    private final RowMapper<CitaCoreDTO> coreMapper = (rs, row) -> new CitaCoreDTO(
        rs.getLong("id"), rs.getLong("cliente_id"), rs.getLong("mascota_id"),
        rs.getLong("medico_id"), rs.getTimestamp("fecha_hora").toLocalDateTime(), rs.getString("estado"));

    /** Inyecta el acceso SQL. */
    public CitaRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    private static final String SELECT_CITAS = "SELECT c.id,c.cliente_id,CONCAT(cl.nombres,' ',cl.apellidos) AS cliente_nombre,c.mascota_id,p.nombre_mascota AS mascota_nombre,c.medico_id,CONCAT(med.nombres,' ',med.apellidos) AS medico_nombre,c.fecha_hora,c.estado,c.motivo FROM cita c LEFT JOIN cliente cl ON cl.cliente_id=c.cliente_id LEFT JOIN mascota p ON p.mascota_id=c.mascota_id LEFT JOIN medico med ON med.id=c.medico_id";

    /** Lista citas aplicando opcionalmente un rango de fechas y orden descendente. */
    public List<CitaDTO> listar(LocalDate desde, LocalDate hasta) {
        StringBuilder sql = new StringBuilder(SELECT_CITAS).append(" WHERE 1=1");
        List<Object> args = new ArrayList<>();
        if (desde != null) { sql.append(" AND c.fecha_hora >= ?"); args.add(Timestamp.valueOf(desde.atStartOfDay())); }
        if (hasta != null) { sql.append(" AND c.fecha_hora < ?"); args.add(Timestamp.valueOf(hasta.plusDays(1).atStartOfDay())); }
        sql.append(" ORDER BY c.fecha_hora DESC");
        return jdbc.query(sql.toString(), mapper, args.toArray());
    }

    /** Obtiene una cita completa para mostrarla o validar reglas de negocio. */
    public CitaDTO obtener(Long id) {
        return jdbc.query(SELECT_CITAS + " WHERE c.id=?", mapper, id).stream().findFirst().orElse(null);
    }

    /** Devuelve los identificadores y fecha requeridos por otros servicios. */
    public CitaCoreDTO obtenerCore(Long id) {
        return jdbc.query("SELECT id,cliente_id,mascota_id,medico_id,fecha_hora,estado FROM cita WHERE id=?", coreMapper, id).stream().findFirst().orElse(null);
    }

    /** Busca citas del mismo veterinario o mascota a menos de 15 minutos, excluyendo estados cancelados. */
    public boolean existeCruce(Long medicoId, Long mascotaId, LocalDateTime fechaHora, Long excluirId) {
        String excludes = " AND LOWER(estado) <> 'cancelada' AND ABS(TIMESTAMPDIFF(SECOND, fecha_hora, ?)) <= 900";
        List<Object> argsMedico = new ArrayList<>();
        argsMedico.add(medicoId);
        if (excluirId != null) { excludes = " AND LOWER(estado) <> 'cancelada' AND id <> ? AND ABS(TIMESTAMPDIFF(SECOND, fecha_hora, ?)) <= 900"; argsMedico.add(excluirId); }
        argsMedico.add(Timestamp.valueOf(fechaHora));
        Integer porMedico = jdbc.queryForObject("SELECT COUNT(*) FROM cita WHERE medico_id=?" + excludes, Integer.class, argsMedico.toArray());
        List<Object> argsMascota = new ArrayList<>();
        argsMascota.add(mascotaId);
        if (excluirId != null) argsMascota.add(excluirId);
        argsMascota.add(Timestamp.valueOf(fechaHora));
        Integer porMascota = jdbc.queryForObject("SELECT COUNT(*) FROM cita WHERE mascota_id=?" + excludes, Integer.class, argsMascota.toArray());
        return (porMedico != null && porMedico > 0) || (porMascota != null && porMascota > 0);
    }

    /** Inserta una cita y retorna su identificador generado. */
    public Long insertar(CitaCoreDTO c, String estado, String motivo) {
        KeyHolder key = new GeneratedKeyHolder();
        jdbc.update(connection -> {
            PreparedStatement ps = connection.prepareStatement("INSERT INTO cita(cliente_id,mascota_id,medico_id,fecha_hora,estado,motivo) VALUES(?,?,?,?,?,?)", Statement.RETURN_GENERATED_KEYS);
            ps.setLong(1, c.clienteId()); ps.setLong(2, c.mascotaId()); ps.setLong(3, c.medicoId());
            ps.setTimestamp(4, Timestamp.valueOf(c.fechaHora())); ps.setString(5, estado); ps.setString(6, motivo);
            return ps;
        }, key);
        return key.getKey().longValue();
    }

    /** Actualiza los campos editables de una cita. */
    public void actualizar(Long id, CitaCoreDTO c, String estado, String motivo) {
        jdbc.update("UPDATE cita SET cliente_id=?,mascota_id=?,medico_id=?,fecha_hora=?,estado=?,motivo=? WHERE id=?",
            c.clienteId(), c.mascotaId(), c.medicoId(), Timestamp.valueOf(c.fechaHora()), estado, motivo, id);
    }
}
