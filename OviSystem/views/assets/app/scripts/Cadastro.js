import Users from "../../_common/classes/Users.js";
import { criarToast } from "../../_common/Toast.js";

const users = new Users();
const toast = criarToast();

const form = document.querySelector(".form");

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(form);

    const data = {
        name: formData.get("name"),
        email: formData.get("email"),
        farm: formData.get("farm"),
        password: formData.get("password")
    };

    console.log(formData.get("password2"));
    if(data.password !== formData.get("password2")){
        toast.show("error", "As senhas não coincidem.");
        return
    }

    try {
        console.log(data)
        const response = await users.register(data);

        console.log(response);
        toast.show("success", "Cadastro realizado com sucesso!");
        window.location.href = "login.html";
    
    } catch (error) {
        console.error("ERROR");
    }

});