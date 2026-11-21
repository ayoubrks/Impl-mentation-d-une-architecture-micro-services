package org.sid.billingservice.web;

import lombok.RequiredArgsConstructor;
import org.sid.billingservice.entities.Bill;
import org.sid.billingservice.entities.ProductItem;
import org.sid.billingservice.feign.CustomerRestClient;
import org.sid.billingservice.feign.ProductRestClient;
import org.sid.billingservice.model.Product;
import org.sid.billingservice.repository.BillRepository;
import org.sid.billingservice.repository.ProductItemRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Date;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class BillRestController {

    private final BillRepository billRepository;
    private final ProductItemRepository productItemRepository;
    private final CustomerRestClient customerRestClient;
    private final ProductRestClient productRestClient;

    @GetMapping(path = "/fullBill/{id}")
    public Bill getBill(@PathVariable("id") Long id) {
        Bill bill = billRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bill not found: " + id));
        return hydrateBill(bill);
    }

    @GetMapping(path = "/fullBills")
    public List<Bill> getAllFullBills() {
        return billRepository.findAll().stream()
                .map(this::hydrateBill)
                .toList();
    }

    @GetMapping(path = "/bills/byCustomer/{customerId}")
    public List<Bill> getBillsByCustomer(@PathVariable("customerId") Long customerId) {
        return billRepository.findByCustomerId(customerId).stream()
                .map(this::hydrateBill)
                .toList();
    }

    @PostMapping(path = "/fullBills")
    @ResponseStatus(HttpStatus.CREATED)
    public Bill createBill(@RequestBody Bill request) {
        Bill bill = Bill.builder()
                .billingDate(request.getBillingDate() != null ? request.getBillingDate() : new Date())
                .customerId(request.getCustomerId())
                .build();
        Bill savedBill = billRepository.save(bill);

        if (request.getProductItems() != null) {
            for (ProductItem itemRequest : request.getProductItems()) {
                double price = itemRequest.getPrice();
                if (price <= 0) {
                    Product product = productRestClient.getProductById(itemRequest.getProductId());
                    price = product.getPrice();
                }
                ProductItem item = ProductItem.builder()
                        .bill(savedBill)
                        .productId(itemRequest.getProductId())
                        .quantity(itemRequest.getQuantity())
                        .price(price)
                        .build();
                productItemRepository.save(item);
            }
        }

        Bill reloaded = billRepository.findById(savedBill.getId()).orElse(savedBill);
        return hydrateBill(reloaded);
    }

    private Bill hydrateBill(Bill bill) {
        try {
            bill.setCustomer(customerRestClient.getCustomerById(bill.getCustomerId()));
        } catch (Exception ignored) {
            // Keep bill resilient if customer-service is temporarily unavailable
        }
        if (bill.getProductItems() != null) {
            bill.getProductItems().forEach(pi -> {
                try {
                    pi.setProduct(productRestClient.getProductById(pi.getProductId()));
                } catch (Exception ignored) {
                    // Keep product item resilient if inventory-service is temporarily unavailable
                }
            });
        }
        return bill;
    }
}
