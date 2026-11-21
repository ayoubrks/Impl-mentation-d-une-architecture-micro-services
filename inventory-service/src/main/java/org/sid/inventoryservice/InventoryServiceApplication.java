package org.sid.inventoryservice;

import org.sid.inventoryservice.entities.Product;
import org.sid.inventoryservice.repository.ProductRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class InventoryServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(InventoryServiceApplication.class, args);
    }

    @Bean
    CommandLineRunner start(ProductRepository productRepository) {
        return args -> {
            productRepository.save(Product.builder().name("Ordinateur Portable").price(9500).quantity(12).build());
            productRepository.save(Product.builder().name("Imprimante Laser").price(1800).quantity(25).build());
            productRepository.save(Product.builder().name("Smartphone 5G").price(4200).quantity(40).build());
            productRepository.findAll().forEach(p -> System.out.println(p.toString()));
        };
    }
}
