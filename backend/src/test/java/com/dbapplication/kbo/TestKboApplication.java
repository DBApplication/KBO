package com.dbapplication.kbo;

import org.springframework.boot.SpringApplication;

public class TestKboApplication {

	public static void main(String[] args) {
		SpringApplication.from(KboApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
