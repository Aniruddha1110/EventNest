package com.eventsphere.backend.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Swagger / OpenAPI configuration.
 *
 * API docs available at : http://localhost:9090/api-docs
 * Swagger UI available at: http://localhost:9090/swagger-ui
 *
 * Adds Bearer JWT authentication to Swagger UI so you can test
 * protected endpoints directly from the browser.
 */
@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI eventSphereOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("EventSphere API")
                        .description("Centralised Event Management System — REST API Documentation")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Team EventSphere")
                                .email("eventsphere.noreply@gmail.com")))
                .addSecurityItem(new SecurityRequirement().addList("Bearer Authentication"))
                .components(new Components()
                        .addSecuritySchemes("Bearer Authentication",
                                new SecurityScheme()
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("Paste your JWT token here (without 'Bearer ' prefix)")));
    }
}