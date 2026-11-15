import Users from "../../_common/classes/Users.js";
import { criarToast } from "../../_common/Toast.js";

const users = new Users();
const toast = criarToast();

const form = document.querySelector(".form");

form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const response = await users.loginFromForm(form);

    if(response.code == 200)
    {
        const token = response.data.token; 
        const id = response.data.id;
        localStorage.setItem("token", token);
        localStorage.setItem("usersId", id);
        localStorage.setItem("photo", response.data.photo || ""); 
        console.log("Token salvo:", token);
        location.href = "lotes.html"
    }
    else
    {
        console.log("ERROR: " + response.message)
        toast.show("error", "Falha no login. Por favor, verifique suas credenciais.");
    }
})



