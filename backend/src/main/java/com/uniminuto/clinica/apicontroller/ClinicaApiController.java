package com.uniminuto.clinica.apicontroller;

import com.uniminuto.clinica.api.ClinicaApi;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ClinicaApiController implements ClinicaApi {

    @Override
    public ResponseEntity<String> testService() {
        return ResponseEntity.ok("Servicio ok");
    }
}
