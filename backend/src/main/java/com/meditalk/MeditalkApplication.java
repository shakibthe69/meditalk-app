package com.meditalk;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EntityScan(basePackages = "com.meditalk.entities")
@EnableJpaRepositories(basePackages = "com.meditalk.repositories")
@EnableScheduling
public class MeditalkApplication {

    public static void main(String[] args) {
        SpringApplication.run(MeditalkApplication.class, args);
    }
}
