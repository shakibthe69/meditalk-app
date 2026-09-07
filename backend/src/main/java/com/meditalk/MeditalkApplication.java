package com.meditalk;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class MeditalkApplication {

    public static void main(String[] args) {
        SpringApplication.run(MeditalkApplication.class, args);
    }
}
