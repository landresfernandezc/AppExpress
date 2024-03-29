import React from 'react';
import Modal from 'react-native-modalbox'
import axios from 'axios';
import { ListView, Text, View, Image, StyleSheet,TextInput, ActivityIndicator, Alert,
Dimensions,Platform,TouchableHighlight,TouchableOpacity} from 'react-native';
import { Button,FormLabel, FormInput } from 'react-native-elements';
import NumericInput,{ calcSize } from 'react-native-numeric-input';
import MapView,{Marker} from 'react-native-maps';
var screen=Dimensions.get('window');
const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const GOOGLE_MAPS_APIKEY = 'AIzaSyC8mGks3qbFCLzbum4CpqhGMhaOucjq3iY';
const LATITUDE = 9.936064;
const LONGITUDE = -84.103382;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

export default class Home extends React.Component {
  static navigationOptions = {
    drawerLabel: 'Inicio',
    drawerIcon: ({ tintColor }) => (
      <Image
        source={require('../assets/images/home.png')}
        style={[styles.icon, {tintColor: tintColor}]}
      />
    )
  };
  constructor(props){
    super(props);
    this.bandera=true;
    this.total=0;
    this.id_cliente="";
    //Esta variable se encarga de ejecutar un hilo que corre cada 25 segundos actualizando la lista de productos
    this.interval= setInterval(() => {
      this.cargarLosProductos();
    }, 25000);
    this.sesion=false;
    this.arrayholder=[{'nombre':"Ensalada",'imagen':"https://mobile-cdn.123rf.com/300wm/serezniy/serezniy1110/serezniy111000110/10752709-sabrosa-ensalada-griega-en-recipiente-transparente-aislado-en-blanco.jpg?ver=6",'precio':1000,'ingredientes':'Tomate,lechuga,pepino,limon','cantidadcalorias':'5'}];
    let ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
    this.arrayholder1=[];
    let ds1 = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
    this.state = {
      region:{
        latitude:LATITUDE,
        longitude:LONGITUDE,
        longitudeDelta:LONGITUDE_DELTA,
        latitudeDelta:LATITUDE_DELTA,
      },
      userName:'',
      password:'', 
      modalVisibleLoginVisible:false,
      value:0,
      dataSource:ds.cloneWithRows(this.arrayholder),
      dataSource1:ds.cloneWithRows(this.arrayholder1),
      text:"",
      modalVisible:false,
      modalCarritoVisible:false,
      producto:{'producto':'','imagen':'','precio':'','ingredientes':'','cantidadcalorias':''},
      isLoading: true,
      modalVisiblePedido:false
    };

  }
  //Se encarga de cargar los productos
  cargarLosProductos(){
    axios.get('https://guarded-eyrie-96688.herokuapp.com/seleccionarProductos')
    .then(response=>{
      let ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
      this.arrayholder=response.data.data;
      this.setState({
        dataSource: ds.cloneWithRows(response.data.data),
        isLoading:false
      }, function() {
        // In this block you can do something with new state.
        this.arrayholder = response.data.data;
      })
    }).catch(function (error) {
      return error.data
  })
  }
  //Funcion que corre al inicio del proyecto
  componentDidMount(){
      if(this.state.isLoading){
        this.cargarLosProductos();
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          var inicia={
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            longitudeDelta:LONGITUDE_DELTA,
            latitudeDelta:LATITUDE_DELTA
          }
          this.setState({
            region:inicia
          });
        },
        (error) => {alert("Ha ocurrido un error")}
      );
  }
  //Esta funcion se encarga de buscar en la lista por nombre y hacer un filtro
  SearchFilterFunction(text){
    const newData = this.arrayholder.filter(function(item){
        const itemData = item.producto.toUpperCase()
        const textData = text.toUpperCase()
        return itemData.indexOf(textData) > -1
    })
    this.setState({
        dataSource: this.state.dataSource.cloneWithRows(newData),
        text: text
    })
}
//Esta funcion se encarga de recuperar un elemento de la lista
GetListViewItem (data){
    this.setState({
      'producto':
      {
      'producto':data.producto,
      'imagen':data.imagen,
      'precio':data.precio,
      'ingredientes':data.ingredientes,
      'cantidadcalorias':data.cantidadcalorias
      },
      'modalVisible':true
                 })
                }

//Esta funcion se encarga de generar las lista del carrito 
GetListCar(){
      console.log(this.arrayholder1);
      this.calculaTotalPedido();
      let ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
            this.setState({
              dataSource1: ds.cloneWithRows(this.arrayholder1),
              modalCarritoVisible:true
            }, function() {
            })
                }

 //Estas funciones se encargan de poner los modal no visibles               
 setStateModal(){
  this.setState({
    'modalVisible':false
               })
}
setStateModalPedido(){
  this.setState({
    'modalVisiblePedido':false
               })
}
setStateModalCarrito(){
  this.setState({
    'modalCarritoVisible':false
               })
}
BuyCar(){
  if(this.state.sesion==true){
    this.setState({modalVisiblePedido:true});
  }
  else{
    this.setState({
      modalVisibleLoginVisible:true
  });
  }
}
//Esta funcion se encarga de validar las credenciales
validarLogin(){
  console.log(this.state.userName+","+this.state.password)
  axios.post('https://guarded-eyrie-96688.herokuapp.com/iniciarSesionCliente',{
    correo:this.state.userName,
    contrasena:this.state.password
    })
    .then(result => {
        console.log(result);
        if(result.data.success==true){
          this.id_cliente=result.data.data.id;
          console.log("Id_cliente:"+this.id_cliente);  
          //Si se autentica inicia la fase del pedido
            this.setState({
              modalCarritoVisible:false,
              modalVisibleLoginVisible:false,
              modalVisiblePedido:true,
              sesion:true
            })
        }
        else{
            alert("Credenciales incorrectas");
            }
        }
    )
    .catch(error=> {
    console.log(error);
    });
    
}
//Se encarga de modificar la cantidad del producto en el carrito
agregarUnidades(cantidad,nombre){
  var listaCarrito=this.arrayholder1;
  for(var x=0;x<listaCarrito.length;x++){
    if(listaCarrito[x].producto==nombre){
        this.arrayholder1[x].cantidad=this.arrayholder1[x].cantidad+cantidad;
    }
  }
}
//Funcion que se encarga de hacer el proceso de pago
pagarPedido(){
    axios.post('https://guarded-eyrie-96688.herokuapp.com/realizarPedido',{
      idCliente:this.id_cliente,
      longitud:this.state.region.longitude,
      latitud:this.state.region.latitude,
      precioFinal:this.total,
      listaProductos:this.arrayholder1
     })
    .then(result => {
        console.log(result);
        if(result.data.success==true){
          alert("Se inserto el pedido con exito")
        }
        else{
            alert("Problemas de red, revise su conexion a internet")
            }
        }
    )
    .catch(error=> {
    console.log(error);
    });
}
//Se encarga de verificar si existe el producto en el carrito
existeProducto(nombre){
  var listaCarrito=this.arrayholder1;
  for(var x=0;x<listaCarrito.length;x++){
    if(listaCarrito[x].producto==nombre){
      return true;
    }
  }
  return false;
}
DeleteFromCar(nombre){
  var listaCarrito=this.arrayholder1;
  for(var x=0;x<listaCarrito.length;x++){
    if(listaCarrito[x].producto==nombre){
      this.arrayholder1.splice(x,1);
      this.calculaTotalPedido();
      this.GetListCar();
    }
  }
}
calculaTotalPedido(){
  var listaPedido=this.arrayholder1;
  var total=0;
  for(var x=0;x<listaPedido.length;x++){
    var subtotal=listaPedido[x].precio*listaPedido[x].cantidad;
    total=total+subtotal;
  }
  this.total=total;
}
addShoppinCar(producto){
  console.log(producto);
    producto.cantidad=this.state.value;
    if(this.existeProducto(producto.producto)){
        console.log("Ya esta el producto en el carrito");
        this.agregarUnidades(this.state.value,producto.producto);
    }
    else{
      this.arrayholder1.push(producto);
      console.log(this.arrayholder1);
      let ds1 = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
            this.setState({
              dataSource1: ds1.cloneWithRows(this.arrayholder1),
              isLoading:false,
              value:0
            }, function() {
  
            });
    }
}
  render(){
    if(this.state.isLoading){
        return(<View/>)           
    }
    return( 
              <View style={styles.containerList}>
                        <View  style={styles.containerHeader}>
                          <TextInput 
                          style={styles.TextInputStyleClass}
                          onChangeText={(text) => this.SearchFilterFunction(text)}
                          value={this.state.text}
                          underlineColorAndroid='transparent'
                          placeholder="Search Here"
                          />
                          <TouchableOpacity style={styles.botonHeader} onPress={this.GetListCar.bind(this)}>
                            <Image source={require("../assets/images/shopping_cart.png")}/>
                          </TouchableOpacity>
                        </View>
                      <ListView
                        style={styles.containerList}
                        dataSource={this.state.dataSource}
                        renderRow={(data) =>
                          <View style={styles.container1}>
                            <Image
                              source={{ uri: data.imagen}}
                              style={styles.img}
                            />
                            <View style={styles.container2}>
                            <Text onPress={this.GetListViewItem.bind(this, data.producto)}>{data.producto}</Text>
                            <Text onPress={this.GetListViewItem.bind(this, data.producto)}> Precio: ${data.precio}</Text>
                            <View style={styles.container1}>
                              <Button title='Detalles' color="black" backgroundColor="#859a9b" onPress={this.GetListViewItem.bind(this,data)}/>
                              <TouchableOpacity style={styles.botonHeader} onPress={this.addShoppinCar.bind(this,data)}>
                                <Image source={require("../assets/images/shopping_car.png")}/>
                              </TouchableOpacity>
                            </View>
                            <NumericInput 
                                      min={1}
                                      max={100}
                                      onChange={value => this.setState({value})} 
                                      totalWidth={calcSize(240)} 
                                      totalHeight={calcSize(50)} 
                                      iconSize={calcSize(25)}
                                      step={1}
                                      valueType='real'
                                      rounded 
                                      textColor='#B0228C' 
                                      iconStyle={{ color: 'black' }} 
                                      rightButtonBackgroundColor='#EA3788' 
                                      leftButtonBackgroundColor='#E56B70'/>
                            </View>
                          </View>
                            }
                      />
                       {/*Este es el modal de mostrar detalles de un producto*/}
                      <Modal
                        style={styles.modal}
                        position='center'
                        backdrop={true}
                        isOpen={this.state.modalVisible}
                        onClosingState={()=>{
                          this.setState({
                            modalVisible:false
                          })
                        }}>
                        <View style={styles.modal1}>
                          <View style={styles.modalImg}>
                            <Image
                                source={{ uri: this.state.producto.imagen}}
                                style={styles.img}
                              />
                          </View>
                          <View style={styles.container2}>
                            <Text>Nombre del producto:{this.state.producto.producto}</Text>
                            <Text>Ingredientes:{this.state.producto.ingredientes}</Text>
                            <Text>Precio:{this.state.producto.precio}</Text>
                            <Text>Cantidad de calorias:{this.state.producto.cantidadcalorias}</Text>
                            <Button style={styles.botonModal} title="Cerrar" color="black" onPress={this.setStateModal.bind(this)}></Button>

                          </View>
                        </View>
                      </Modal>
                      {/*Este es el modal del carrito de compras*/}
                      <Modal
                        style={styles.modal2}
                        position='center'
                        backdrop={true}
                        isOpen={this.state.modalCarritoVisible}
                        onClosingState={()=>{
                          this.setState({
                            modalCarritoVisible:false
                          })
                        }}>
                        <View style={styles.modal3}>
                        <View style={styles.modalImg1}>
                          <Text style={styles.elemento}>   Img  </Text>
                          <Text style={styles.elemento}>Nombre  </Text>
                          <Text style={styles.elemento}>Precio  </Text>
                          <Text style={styles.elemento}>Cantidad  </Text>
                          <Text style={styles.elemento}>Subtotal</Text>
                          <TouchableOpacity style={styles.botonHeaderModalCar} onPress={this.setStateModalCarrito.bind(this)}>
                                <Image source={require("../assets/images/close.png")}/>
                        </TouchableOpacity>
                        </View>
                        <ListView
                        style={styles.containerList}
                        dataSource={this.state.dataSource1}
                        renderRow={(data) =>
                          <View style={styles.modalImg1}>
                            <Image
                              source={{ uri: data.imagen}}
                              style={styles.img1}
                            />
                            <Text style={styles.elemento}>{data.producto}  </Text>
                            <Text style={styles.elemento}>₡{data.precio}  </Text>
                            <Text style={styles.elemento}>{data.cantidad}  </Text>
                            <Text style={styles.elemento}>{data.cantidad*data.precio}</Text>
                            <TouchableOpacity style={styles.botonHeader1} onPress={this.DeleteFromCar.bind(this,data.producto)}>
                            <Image source={require("../assets/images/remove_shopping_cart.png")}/>
                            </TouchableOpacity>
                          </View>
                            }
                      />
                      <View style={styles.modalImg1}>
                        <TouchableOpacity style={styles.botonHeader} onPress={this.BuyCar.bind(this)}>
                                  <Image source={require("../assets/images/payment.png")}/>
                          </TouchableOpacity>
                          <Text>Total: ₡{this.total}</Text>
                      </View>
                        </View>
                      </Modal>
                      {/*Este es el modal del Login*/}
                      <Modal
                        style={styles.modal}
                        position='center'
                        backdrop={true}
                        onClosingState={()=>{
                          this.setState({
                            modalVisibleLoginVisible:false
                          })
                        }}
                        isOpen={this.state.modalVisibleLoginVisible}>
                        <View style={styles.containerLogin}>
                            <Text >Bienvenido a InstantFoodExpress</Text>
                            <FormLabel>Digite su usuario</FormLabel>
                            <TextInput style={styles.inputLogin}
                            underlineColorAndroid='transparent'
                            placeholder="Digite su usuario"
                              onChangeText={text => this.setState({ userName: text })}
                            />
                            <FormLabel>Contraseña</FormLabel>
                            <TextInput style={styles.inputLogin}
                              underlineColorAndroid='transparent'
                              placeholder="Digite su contraseña"
                              onChangeText={text => this.setState({ password: text })}
                            />
                            <Button 
                              onPress={this.validarLogin.bind(this)}
                              buttonStyle={[{ marginBottom: 5, marginTop: 5 }]}
                              title="Login"
                            />
                        </View>
                      </Modal>
                      {/*Este es el modal del Pedido*/}
                      <Modal
                        style={styles.modalPedidos}
                        position='center'
                        backdrop={true}
                        onClosingState={()=>{
                          this.setState({
                            modalVisiblePedido:false
                          })
                        }}
                        isOpen={this.state.modalVisiblePedido}>
                        <View style={styles.containerLogin}>
                              <MapView
                                  region={this.state.region}
                                  style={styles.map}
                                  ref={c => this.mapView = c}
                                  onPress={(event)=>{ 
                                    console.log(event.nativeEvent.coordinate)
                                    var regionActual={
                                      latitude:event.nativeEvent.coordinate.latitude,
                                      longitude:event.nativeEvent.coordinate.longitude,
                                      longitudeDelta:LONGITUDE_DELTA,
                                      latitudeDelta:LATITUDE_DELTA
                                    }
                                    this.setState({region:regionActual});
                                  }}
                              >
                              <Marker
                                coordinate={this.state.region}/>
                              </MapView>
                        </View>
                        <View style={styles.modalImg1}>
                        <TouchableOpacity style={styles.botonHeader} onPress={this.pagarPedido.bind(this)}>
                                <Image source={require("../assets/images/payment.png")}/>
                        </TouchableOpacity>
                        <Button style={styles.botonModal} title="Cerrar" color="black" onPress={this.setStateModalPedido.bind(this)}></Button>

                        </View>
                        
                      </Modal>
              </View>
    );
  }
}
const styles = StyleSheet.create({
  map:{
    marginTop: 0,
    height:500,
    width:350
  },
  containerLogin:{
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ecf0f1',
    flexDirection:'column'
  },
  inputLogin: {
    borderRadius: 5,
    backgroundColor:'#8AE2FF',
    width: 200,
    height: 44,
    borderWidth: 1,
    borderColor: 'black'
  },
  containerList: {
    flex: 1,
    marginTop: 20,
    flexDirection: 'column'
  },container1: {
    flex: 1,
    marginTop: 0,
    flexDirection: 'row',
  },containerHeader: {
    marginTop: 0,
    marginLeft: 0,
    flexDirection: 'row',
    height:20
  },container2:{
    flex: 1,
    marginTop: 10,
    flexDirection: 'column',
  },modalImg: {
    flex: 1,
    justifyContent: 'center',
    marginTop: 10,
    flexDirection: 'column',
  },modalImg1: {
    flexDirection: 'row',
  },elemento:{
    flexDirection: 'column',
  },modal1: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },modal3: {
    flex: 1,
    flexDirection: 'column'
  },
  img:{
    marginTop: 10,
    marginLeft: 0,
    width: 193,
    height: 110,
  },
  img1:{
    marginTop: 10,
    marginLeft: 0,
    width: 30,
    height: 30,
    flexDirection: 'column',
  },img_car:{
    marginTop: 10,
    marginLeft: 0,
    width: 50,
    height: 50,
  },modal:{
    justifyContent:'center',
    borderRadius: Platform.OS==='android'?30:0,
    shadowRadius: 10,
    width:screen.width-80,
    height:280
  },modalPedidos:{
    borderRadius: Platform.OS==='android'?30:0,
    shadowRadius: 10,
    width:screen.width-10,
    height:screen.height-10
  },modal2:{
    justifyContent:'center',
    borderRadius: Platform.OS==='android'?30:0,
    shadowRadius: 5,
    width:screen.width-10,
    height:screen.height-10
  },botonModal:{
    marginBottom:0
  },botonHeader:{
    marginRight:0,
    backgroundColor:'#859a9b',
    borderRadius: 5,
    width:45,
    height:45,
    marginBottom: 20,
    shadowColor: '#303838',
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 10,
    shadowOpacity: 0.35,
  },botonHeaderModalCar:{
    marginRight:0,
    backgroundColor: '#859a9b',
    borderRadius: 5,
    width:35,
    height:45,
    marginBottom: 20,
    shadowColor: '#303838',
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 10,
    shadowOpacity: 0.35,
    justifyContent:'center',
  },botonHeader1:{
    marginRight:0,
    backgroundColor: '#859a9b',
    borderRadius: 5,
    padding: 10,
    width:30,
    height:30,
    marginBottom: 20,
    shadowColor: '#303838',
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 10,
    shadowOpacity: 0.35,
  },icon: {
    width: 24,
    height: 24,
  },TextInputStyleClass:{
    backgroundColor:'#8AE2FF',
    height:45,
    width:300
  }
});