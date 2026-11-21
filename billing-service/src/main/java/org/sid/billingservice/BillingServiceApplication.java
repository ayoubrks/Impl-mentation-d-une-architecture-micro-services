package org.sid.billingservice;

import org.sid.billingservice.entities.Bill;
import org.sid.billingservice.entities.ProductItem;
import org.sid.billingservice.feign.CustomerRestClient;
import org.sid.billingservice.feign.ProductRestClient;
import org.sid.billingservice.model.Customer;
import org.sid.billingservice.model.Product;
import org.sid.billingservice.repository.BillRepository;
import org.sid.billingservice.repository.ProductItemRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.context.annotation.Bean;

import java.util.Collection;
import java.util.Date;
import java.util.Random;

@SpringBootApplication
@EnableFeignClients
public class BillingServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(BillingServiceApplication.class, args);
    }

    @Bean
    CommandLineRunner start(
            BillRepository billRepository,
            ProductItemRepository productItemRepository,
            CustomerRestClient customerRestClient,
            ProductRestClient productRestClient) {
        return args -> {
            try {
                Collection<Customer> customers = customerRestClient.allCustomers().getContent();
                Collection<Product> products = productRestClient.allProducts().getContent();
                Random random = new Random();

                for (Customer customer : customers) {
                    Bill bill = billRepository.save(Bill.builder()
                            .billingDate(new Date())
                            .customerId(customer.getId())
                            .build());
                    for (Product product : products) {
                        ProductItem productItem = ProductItem.builder()
                                .bill(bill)
                                .productId(product.getId())
                                .quantity(1 + random.nextInt(5))
                                .price(product.getPrice())
                                .build();
                        productItemRepository.save(productItem);
                    }
                }
            } catch (Exception e) {
                System.err.println("Initial billing seed skipped (customer/inventory services may not be up yet): " + e.getMessage());
            }
        };
    }
}
