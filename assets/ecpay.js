export async function startEcpayCheckout({ supabaseClient, orderId, orderNo, packageType, amount }) {
  if (!supabaseClient) throw new Error("會員中心尚未完成初始化。");

  trackPaymentInitiated(packageType, amount);

  const { data, error } = await supabaseClient.functions.invoke("ecpay-create-payment", {
    body: {
      order_id: orderId,
      order_no: orderNo
    }
  });

  if (error) {
    throw new Error(data?.error || error.message || "付款連結建立失敗。");
  }

  if (!data?.ok) {
    throw new Error(data?.error || "付款連結建立失敗。");
  }

  if (data.free) return data;
  submitEcpayForm(data.payment_url, data.fields);
  return data;
}

function submitEcpayForm(actionUrl, fields) {
  if (!actionUrl || !fields || typeof fields !== "object") {
    throw new Error("付款參數不完整。");
  }

  const form = document.createElement("form");
  form.method = "POST";
  form.action = actionUrl;
  form.style.display = "none";

  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = String(value);
    form.append(input);
  }

  document.body.append(form);
  form.submit();
}

function trackPaymentInitiated(packageType, amount) {
  if (typeof window.adforgeTrack === "function") {
    window.adforgeTrack("payment_initiated", {
      package_type: packageType,
      value: Number(amount || 0),
      currency: "TWD"
    });
  }

  if (typeof window.fbq === "function") {
    window.fbq("track", "InitiateCheckout", {
      value: Number(amount || 0),
      currency: "TWD",
      content_name: packageType || "ADFORGE order"
    });
  }
}
