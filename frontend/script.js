
  const apiServer = "localhost:3000";  // Docker'da 'api' servis adı kullanılmalı
  const userId = localStorage.getItem('userId') || 1; 
  const orderStatus = document.getElementById('orderStatus');
  const orderForm = document.getElementById('orderForm');
  const submitButton = document.getElementById('submitButton');
  
  orderForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    submitButton.disabled = true;
    submitButton.textContent = 'Yükleniyor...';

    const email = document.getElementById('email').value;
    if (!email) {
      orderStatus.textContent = 'Lütfen geçerli bir e-posta adresi girin.';
      orderStatus.classList.add('error');
      submitButton.disabled = false;
      submitButton.textContent = 'Sipariş Ver';
      return;
    }

    try {
      const response = await fetch(`http://${apiServer}/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email, items: [{ productId: 1, quantity: 1 }] }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        orderStatus.textContent = `Hata: ${errorData.message || 'Bilinmeyen bir hata oluştu.'}`;
        orderStatus.classList.add('error');
        return;
      }

      const result = await response.json();
      const jobId = result.jobId;

      // WebSocket bağlantısı
      const ws = new WebSocket(`ws://${apiServer}/${jobId}`);
      ws.onmessage = (event) => {
        console.log("event", event);
        const data = JSON.parse(event.data);
        orderStatus.textContent = `Durum: ${data.status}`;
        orderStatus.classList.remove('error');
        orderStatus.classList.add(data.status === "success" ? 'success' : 'error');
      };

    } catch (error) {
      orderStatus.textContent = 'Bir hata oluştu. Lütfen tekrar deneyin.';
      orderStatus.classList.add('error');
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Sipariş Ver';
    }
  });