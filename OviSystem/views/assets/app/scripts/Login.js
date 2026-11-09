import Users from "../../_common/classes/Users.js";

const users = new Users();

const form = document.querySelector(".form");

form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const response = await users.loginFromForm(form);

    console.log(response.data.id)
    if(response.code == 200)
    {
        const token = response.data.token; 
        const id = response.data.id;
        localStorage.setItem("token", token);
        localStorage.setItem("usersId", id); 
        console.log("Token salvo:", token);
        location.href = "lotes.html"
    }
    else
    {
        console.log("ERROR: " + response.message)
    }
})



