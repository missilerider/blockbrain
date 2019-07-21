var app = new Vue({
  el: '#app',
  data: {
    message: 'Hello Vue!'
  },
  mounted() {
    axios.get('/api/v1/services')
      .then(function(resp) {
        console.log(resp.data);
      });
  }
})
