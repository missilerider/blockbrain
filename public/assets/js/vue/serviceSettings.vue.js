var app = new Vue({
  el: '#app',
  data: {
    service: {
      name: "", 
      id: "", 
      description: ""
    }, 
    customProperties: {}
  },
  mounted() {
    let self = this;
    let url = new URL(window.location.href);
    let srvId = url.searchParams.get("id");
    axios.get('/api/v1/services/' + srvId)
      .then(function(resp) {
        if(!('code' in resp.data)) {
          self.customProperties = resp.data.template;

          Vue.set(self.$data, 'service', resp.data);
        }
        else
          console.error("Could not retrieve service information!");
      });
  },
  methods: {
    updateServiceOnBoot: function(id) {
      var that = this;
      axios.post('/api/v1/services/' + id, {
        startOnBoot: this.services[id].startOnBoot
      })
        .then(function(resp) {
          if(resp.data.result != "OK") {
            that.services[id].startOnBoot = !that.services[id].startOnBoot;
          }
        });
    },
    startService: function(id) {
      var that = this;
      this.showNotification('Sent <b>start</b> signal to service ' + id, 'info', 'device_hub', 1);
      axios.get('/api/v1/services/' + id + '/start')
        .then(function(resp) {
          if(resp.data.result == "OK") {
            that.services[id] = resp.data.service;
            if(resp.data.service.status.status != "running" ||
              resp.data.service.status.status != "stopped") {
              setTimeout(that.updateService.bind(null, id), 200);
            } else {
              this.showNotification('Service ' + id + ' entered status <b>' + resp.data.service.status.status + '</b>', 'success', 'device_hub', 2000);
            }
          }
        });
    },
    restartService: function(id) {
      var that = this;
      this.showNotification('Sent <b>restart</b> signal to service ' + id, 'info', 'device_hub', 1000);
      axios.get('/api/v1/services/' + id + '/restart')
        .then(function(resp) {
          if(resp.data.result == "OK") {
            that.services[id] = resp.data.service;
            if(resp.data.service.status.status != "running" ||
              resp.data.service.status.status != "stopped") {
              setTimeout(that.updateService.bind(null, id), 1000);
            } else {
              this.showNotification('Service ' + id + ' entered status <b>' + resp.data.service.status.status + '</b>', 'success', 'device_hub', 2000);
            }
          }
        });
    },
    stopService: function(id) {
      var that = this;
      this.showNotification('Sent <b>stop</b> signal to service ' + id, 'info', 'device_hub', 1000);
      axios.get('/api/v1/services/' + id + '/stop')
        .then(function(resp) {
          if(resp.data.result == "OK") {
            that.services[id] = resp.data.service;
            if(resp.data.service.status.status != "running" ||
              resp.data.service.status.status != "stopped") {
              setTimeout(that.updateService.bind(null, id), 1000);
            } else {
              this.showNotification('Service ' + id + ' entered status <b>' + resp.data.service.status.status + '</b>', 'success', 'device_hub', 2000);
            }
          }
        });
    },
    updateService: function(id) {
      var that = this;
      if(that.services[id].status.status == "running" ||
        that.services[id].status.status == "stopped") {
          this.showNotification('Service ' + id + ' entered status <b>' + that.services[id].status.status + '</b>', 'success', 'device_hub', 2000);
      } else {
        axios.get('/api/v1/services/' + id)
          .then(function(resp) {
            that.services[id] = resp.data;
            if(resp.data.status.status != "running" &&
              resp.data.status.status != "stopped") {
              setTimeout(that.updateService.bind(null, id), 1000);
            } else {
              that.showNotification('Service ' + id + ' entered status <b>' + that.services[id].status.status + '</b>', 'success', 'device_hub', 2000);
            }
          });
        }
    },
    serviceSettings: function(id) {
      window.location = "serviceSettings.html?id=" + id;
    }, 
    customPropComponent: function(t) {
      return customComponents(t);
    },
    setProperty(prop, val) {
      console.dir(prop);
      console.dir(val);
      this.customProperties.default[prop] = val;
    }, 
    showNotification: function(msg, type, icon, timeout) {
      $.notify({
        icon: icon, // material
        message: msg

      }, {
        type: type, // ['', 'info', 'danger', 'success', 'warning', 'rose', 'primary'];
        timer: timeout, // ms
        placement: {
          from: 'top',
          align: 'right'
        }
      });
    }, 
    applyChanges: function() {
      //console.dir(this.customProperties.default);
      let that = this;
      axios.post(`/api/v1/services/${that.service.id}/settings`, that.customProperties.default)
        .then(function(resp) {
          if(resp.data.result != "OK") {
            that.showNotification(`Configuration of service ${that.service.name} could not be applied. Reason: ${resp.data.message}`, 'danger', 'error', 10000);
          } else {
            if(resp.data.action)
              that.showNotification(`Configuration of service ${that.service.name} correctly applied.<br/><h3>${resp.data.action}</h3>`, 'info', 'thumb_up', 2000);
            else
            that.showNotification(`Configuration of service ${that.service.name} completely be applied`, 'success', 'thumb_up', 1000);
          }
        });
    }
  }
})
