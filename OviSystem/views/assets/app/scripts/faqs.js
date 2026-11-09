async function fetchFAQs() {
    const response = await fetch("http://localhost/OviSystem/api/faqs/category/1");

    console.log(response);

    const faqs = await response.json();

    console.log(faqs.data);

    const listFaqs = document.querySelector(".faq__list");

    faqs.data.forEach(faq => {
        console.log(faq.answer, faq.question);

        const faqItem = document.createElement("li");

        faqItem.innerHTML = `
            <details class="faq__item">
                <summary>${faq.question}</summary>
                <p>${faq.answer}</p>
            </details>
        `;

        listFaqs.appendChild(faqItem);
    });
}

fetchFAQs();