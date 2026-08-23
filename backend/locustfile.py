from locust import HttpUser, task, between

class IFCUser(HttpUser):
    wait_time = between(1, 3)

    def on_start(self):
        response = self.client.post("/api/token/", json={
            "username": "locust_user",
            "password": "locust_pass"
        })
        if response.status_code == 200:
            token = response.json().get("access")
            self.client.headers.update({"Authorization": f"Bearer {token}"})
        else:
            print(f"Ошибка получения токена: {response.status_code} {response.text}")

    @task
    def download_file(self):
        filename = "medium.ifc" 
        with self.client.get(f"/api/file/{filename}/", catch_response=True) as resp:
            if resp.status_code != 200:
                resp.failure(f"Ошибка скачивания: {resp.status_code} {resp.text}")