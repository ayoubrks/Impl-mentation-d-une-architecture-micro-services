package org.sid.billingservice.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.sid.billingservice.model.Customer;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Bill {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Date billingDate;
    private Long customerId;

    @OneToMany(mappedBy = "bill", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @Builder.Default
    private Collection<ProductItem> productItems = new ArrayList<>();

    @Transient
    private Customer customer;

    public double getTotal() {
        if (productItems == null) {
            return 0;
        }
        return productItems.stream()
                .mapToDouble(ProductItem::getAmount)
                .sum();
    }
}
