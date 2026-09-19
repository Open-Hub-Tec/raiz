import React, { useState, useEffect } from 'react';
import { AppLanguage, DigitalPassportLot, NavigationTab, ProductItem, ScreenView } from './types';
import { sanitizeProductName } from './utils/productUtils';
import { INITIAL_PRODUCTS, INITIAL_VERIFIED_LOTS } from './data/mockData';
import { TopAppBar } from './components/TopAppBar';
import { BottomNavBar } from './components/BottomNavBar';
import { MainMenuScreen } from './components/MainMenuScreen';
import { ChatScreen } from './components/ChatScreen';
import { ProductTypeCatalogScreen } from './components/ProductTypeCatalogScreen';
import { RegisterCoffeeLotScreen } from './components/RegisterCoffeeLotScreen';
import { DigitalPassportScreen } from './components/DigitalPassportScreen';
import { BuyerShowcaseScreen } from './components/BuyerShowcaseScreen';
import { MyLotsModal } from './components/MyLotsModal';
import { MyPaymentsModal } from './components/MyPaymentsModal';
import { NormativeCertificateModal } from './components/NormativeCertificateModal';
import { CartModal, CartItem } from './components/CartModal';
import { RegionalMapModal } from './components/RegionalMapModal';
import { MicrophoneDiagnosticModal } from './components/MicrophoneDiagnosticModal';
import { RaizCore } from './core';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('menu');
  const [currentScreen, setCurrentScreen] = useState<ScreenView>('menu_principal');
  const [appLanguage, setAppLanguage] = useState<AppLanguage>('es');
  const [elderMode, setElderMode] = useState<boolean>(false);

  // Active data
  const [lots, setLots] = useState<DigitalPassportLot[]>(INITIAL_VERIFIED_LOTS);
  const [products] = useState<ProductItem[]>(INITIAL_PRODUCTS);
  const [selectedLot, setSelectedLot] = useState<DigitalPassportLot>(INITIAL_VERIFIED_LOTS[0]);
  const [selectedProductType, setSelectedProductType] = useState<string>('Café');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Modals
  const [isLotsModalOpen, setIsLotsModalOpen] = useState(false);
  const [isPaymentsModalOpen, setIsPaymentsModalOpen] = useState(false);
  const [isDictamenModalOpen, setIsDictamenModalOpen] = useState(false);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [isMicDiagnosticModalOpen, setIsMicDiagnosticModalOpen] = useState(false);
  const [targetChatProducer, setTargetChatProducer] = useState<string | null>(null);
  const [chatInitialMessage, setChatInitialMessage] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Monitor network status for Modo Parcela (Offline Mode) & Initialize RaizCore
  useEffect(() => {
    RaizCore.init();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Deep-linking from shared certificate links (e.g., ?cert=MX-2024-984 or ?cert=lot-984)
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const rawParam = urlParams.get('cert') || urlParams.get('lote') || urlParams.get('dictamen');
      if (rawParam) {
        const cleanParam = rawParam.replace(/^MX-/i, '').toLowerCase();
        const found = lots.find(
          (l) =>
            l.code.toLowerCase() === rawParam.toLowerCase() ||
            l.code.toLowerCase() === cleanParam ||
            l.id.toLowerCase() === rawParam.toLowerCase() ||
            l.id.toLowerCase() === cleanParam ||
            l.code.toLowerCase().includes(cleanParam)
        );
        if (found) {
          setSelectedLot(found);
          setIsDictamenModalOpen(true);
          setCurrentTab('productos');
          setCurrentScreen('pasaporte_digital');
        }
      }
    } catch (err) {
      console.error('Error procesando enlace de certificado:', err);
    }
  }, [lots]);

  // Tab change handler
  const handleTabChange = (tab: NavigationTab) => {
    setCurrentTab(tab);
    if (tab === 'menu') {
      setCurrentScreen('menu_principal');
    } else if (tab === 'chat') {
      setCurrentScreen('registro_productor');
    } else if (tab === 'productos') {
      setCurrentScreen('vitrina_productos');
    }
  };

  // Screen navigation handler
  const handleNavigateScreen = (screen: ScreenView, productType?: string) => {
    if (productType) {
      setSelectedProductType(sanitizeProductName(productType));
    }
    setCurrentScreen(screen);
    if (screen === 'vitrina_productos' || screen === 'pasaporte_digital') {
      setCurrentTab('productos');
    } else if (screen === 'registro_productor') {
      setCurrentTab('chat');
    } else {
      setCurrentTab('menu');
    }
  };

  // Cart operations
  const handleAddToCart = (item: CartItem) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i
        );
      }
      return [...prev, item];
    });
    setIsCartModalOpen(true);
  };

  const handleRemoveFromCart = (id: string) => {
    setCartItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleUpdateCartQuantity = (id: string, qty: number) => {
    setCartItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity: Math.max(1, qty) } : i))
    );
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  // Direct Contact handler from Vitrina / Pasaporte
  const handleDirectContact = (artisanName: string, productTitle?: string) => {
    setTargetChatProducer(artisanName);
    if (productTitle) {
      setChatInitialMessage(`Hola ${artisanName}, me interesa conocer más sobre "${productTitle}".`);
    } else {
      setChatInitialMessage(`Hola ${artisanName}, me pongo en contacto directo por su producto.`);
    }
    setCurrentTab('chat');
    setCurrentScreen('registro_productor');
  };

  // New lot creation after Step 3
  const handleLotCreated = (customLot?: Partial<DigitalPassportLot>) => {
    const timestamp = new Date().toISOString();
    const mockLedger = Math.floor(52490000 + Math.random() * 10000);
    const mockTxHash = `0x${Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

    const prodType = customLot?.productType || selectedProductType || 'Café de Especialidad';
    const isPulque = prodType.toLowerCase().includes('pulque') || prodType.toLowerCase().includes('aguamiel') || prodType.toLowerCase().includes('tinacal');
    const isTextil = prodType.toLowerCase().includes('textil');
    const isPalma = prodType.toLowerCase().includes('sombrero') || prodType.toLowerCase().includes('palma');
    const isMiel = prodType.toLowerCase().includes('miel');
    const isMaiz = prodType.toLowerCase().includes('maíz') || prodType.toLowerCase().includes('maiz');
    const isTomate = prodType.toLowerCase().includes('jitomate') || prodType.toLowerCase().includes('tomate');

    const defaultImg = isPulque
      ? 'https://images.unsplash.com/photo-1546853020-ca4909aef454?w=800&auto=format&fit=crop&q=80'
      : isTextil
      ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuB5Ch3EnTKfOPzLhJvKhO3lCcPIUAE3hVVkfX5Im0s-WO1vCixJXClxdVdruWiPRqr3ZuxAzdlH3yAof7r8gqeX3gu9Ib76kDaeSl6pOyNhXt8PsFUfn2Jc7_xqUysoYwZ8H3nJ1yfgy2pOSZt3H-5XCr1VJuyIa-sigPM_rzR4gUCUs1ekNF4IJND5FqstPVswevuKVBQzWO0uds-_-hVuY5mZRW5VnjA9Ovw00rmRFDxpZZ5yIbtMBA'
      : isPalma
      ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuDkQ_T-4HkMOGbUXCEL4WB3G-nckbk4y8MBXaW8RROxSTNJ7CpRum4bbwbnLCoYIsiGQouYyMcMM8EHk1DzR9XrOLMdVSb-RqJUa1aBk1p6JnwmWpKfFndzgY1CS6A1wg_wb_ZV0zrKj5zVgEEMN7Z3_m97Xx-9YigQ14ZAHHNVhaRXXI0nBiVqxjMXJ8MLMVi_gKnPRfs1qzravdO-6Uv0M8q2gl5pOM-K5nYvOyXYJ1GfD99czI_Ltw'
      : isMiel
      ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuA8ZBROS9VsAw7NHM5L1DmOrsjS5_bgY5WUAX2CWi4t5af2aINWReGNta7MhraFl1vMglwJfhe52szbMFK3zJCSVdtzGS8Wxk4FAPcGg0ryh6r5SO--xklxpgEP7fXFnRFHhG28vL6IwUl3qW6cFysfAyubAB0o5lspYGGWJSMCYFqxBvweNm6W2qlz6HlxvvKjRiSwLsfBYXxK7Cv3WSoPy77qwwVCiEOx_s0cTXnQKPYnYNHr48piLg'
      : isMaiz
      ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuAx4jUpQopozBH8CYGA3m-Tfhex_UjwxY-4UKei8h4QhxSSmzObP9OdoONSXqi0XITG11whMMoDAOmA4bw0hSNWommPAh4F1D5ffA86lEaxrdfmf3kJ11rzljgIJllTeHX25OBP5QgRG79YiKsHHOLHgZPBf6D-AEEoGtbjiemIcHXuuXj7ZM1cyu0e6F19V9rkEX4nPjc7Dsc2w4tfJ_eHgPoPJzpuWKstIg6jmmd_4HM4ixO1PrSK4Q'
      : isTomate
      ? 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&auto=format&fit=crop&q=80'
      : 'https://lh3.googleusercontent.com/aida-public/AB6AXuDVqal830zp_JFXZ3K1_Rr7bbte3jwc_lJwXPf-TxcAcEg2raHlxCK89btRwH4uwzhF2fLfO_VmIZsA4gTepWeTnnrV6vLEcToMhwFBkbarbh5uwCol3bpetHUY8kzwnxJxVdtmqGOZThqZnec77V9oKnLql4l29d8XAJan9Acm66pPUlaO6eAOQymtE0KneK_qV0L0sOeux4_wReZWm6lmbXiAdjKdpv5FSyJqzx_42kMz_U4T3L2q_g';

    const evidencePhotos = isPulque
      ? {
          grainGridSampleUrl: defaultImg,
          humidityGaugeUrl: 'https://images.unsplash.com/photo-1546853020-ca4909aef454?w=600&auto=format&fit=crop&q=80',
          foliarHealthUrl: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=600&auto=format&fit=crop&q=80'
        }
      : isTextil
      ? {
          grainGridSampleUrl: defaultImg,
          humidityGaugeUrl: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=600&auto=format&fit=crop&q=80',
          foliarHealthUrl: 'https://images.unsplash.com/photo-1590736704728-f4730bb30770?w=600&auto=format&fit=crop&q=80'
        }
      : isPalma
      ? {
          grainGridSampleUrl: defaultImg,
          humidityGaugeUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuADMzysc8buYnt4_J6N6fK3aJOpQwIXmK6rDrxaTI_kI2QHwPZaveZN-R-YpdSXJl83jv428Yd5_IFDtytjOVkkte6-yB6pXskpvxdiTLt3gQ4EoFSAS1SzELEaKKIDGkkY-oWJOM68851O2vaSsz92iubLVZ69vQp19ZYBqh38PsSqvSJ-_I0vXR4ZpTDTgoRrmCS2f5HnSOLlMZWIdp0uyeXZVn1fkdUzQelGLAyhj_tOsM-t8ikpbQ',
          foliarHealthUrl: 'https://images.unsplash.com/photo-1572307480813-ceb0e59d8325?w=600&auto=format&fit=crop&q=80'
        }
      : isMiel
      ? {
          grainGridSampleUrl: defaultImg,
          humidityGaugeUrl: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&auto=format&fit=crop&q=80',
          foliarHealthUrl: 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=600&auto=format&fit=crop&q=80'
        }
      : isMaiz
      ? {
          grainGridSampleUrl: defaultImg,
          humidityGaugeUrl: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=600&auto=format&fit=crop&q=80',
          foliarHealthUrl: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=600&auto=format&fit=crop&q=80'
        }
      : isTomate
      ? {
          grainGridSampleUrl: defaultImg,
          humidityGaugeUrl: 'https://images.unsplash.com/photo-1546470427-227c7369a9b2?w=600&auto=format&fit=crop&q=80',
          foliarHealthUrl: 'https://images.unsplash.com/photo-1582284540020-8acbe03f4924?w=600&auto=format&fit=crop&q=80'
        }
      : {
          grainGridSampleUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDVqal830zp_JFXZ3K1_Rr7bbte3jwc_lJwXPf-TxcAcEg2raHlxCK89btRwH4uwzhF2fLfO_VmIZsA4gTepWeTnnrV6vLEcToMhwFBkbarbh5uwCol3bpetHUY8kzwnxJxVdtmqGOZThqZnec77V9oKnLql4l29d8XAJan9Acm66pPUlaO6eAOQymtE0KneK_qV0L0sOeux4_wReZWm6lmbXiAdjKdpv5FSyJqzx_42kMz_U4T3L2q_g',
          humidityGaugeUrl: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600&auto=format&fit=crop&q=80',
          foliarHealthUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80'
        };

    // Base template
    const baseLot: DigitalPassportLot = {
      id: `lot-${Date.now()}`,
      code: `MX-2024-${Math.floor(900 + Math.random() * 99)}`,
      title: isPulque
        ? 'Pulque Tradicional de Maguey Mixteco'
        : isTextil
        ? 'Rebozo Tradicional en Telar'
        : isPalma
        ? 'Sombrero Costeño de Palma Fina'
        : isMiel
        ? 'Miel Virgen de Abeja de la Mixteca'
        : isMaiz
        ? 'Maíz Azul Criollo Nativo'
        : isTomate
        ? 'Jitomate Saladette Agroecológico'
        : 'Café Arábica Pluma Hidalgo Lavado',
      productType: prodType,
      imageUrl: customLot?.imageUrl || defaultImg,
      imageAlt: 'Muestra de cosecha o artesanía',
      producerName: isPulque ? 'Don Aurelio López' : 'Don Efraín Bautista Santiago',
      producerInitials: isPulque ? 'AL' : 'EB',
      location: isPulque ? 'San Mateo Peñasco, Tlaxiaco, Oax.' : 'Magdalena Peñasco, Tlaxiaco, Oax.',
      volumeKg: isPulque ? 80 : 680,
      verifiedStatus: isPulque ? '100% Aguamiel Puro (Tinacal Tradicional)' : 'Calidad Comunitaria Aprobada (Sello Tec)',
      evaluatorOrg: 'Laboratorio de Calidad Mixteco & Tec Hub',
      tags: isPulque
        ? ['100% Aguamiel', 'Tinacal Artesanal', 'Sin Adulterar', 'Maguey Manso']
        : ['Cero intermediarios', 'Origen Mixteca Alta', 'Precio Justo Directo'],
      timeline: [
        {
          title: 'Registro y Cosecha/Elaboración en Parcela',
          dateAndLocation: 'Hace 5 días · Magdalena Peñasco, Oax.',
          color: '#032517'
        },
        {
          title: 'Inspección de Calidad y Muestra de Origen',
          dateAndLocation: 'Hace 2 días · Laboratorio del TecNM Tlaxiaco',
          color: '#032517'
        },
        {
          title: 'Emisión de Sello Digital Comunitario',
          dateAndLocation: `Hoy · Folio Digital #${mockLedger.toLocaleString()}`,
          color: '#a73918'
        }
      ],
      pricePerKg: 115.0,
      hash: mockTxHash.slice(0, 10) + '...' + mockTxHash.slice(-13),
      variety: 'Pluma Hidalgo / Arabica',
      altitude: '1,650 msnm (Estricta Altura)',
      process: 'Lavado Tradicional Artesanal',
      notes: 'Lote registrado con trazabilidad de origen y respaldo comunitario de la Mixteca Alta.',
      nomCompliance: {
        standard: 'NOM-255-SCFI / Sello Mixteca',
        humidity: '11.4%',
        humidityCompliant: true,
        defectPercentage: 1.1,
        defectClassification: 'Grado Especialidad / Exportación (< 2% defectos)',
        altitudeMeters: 1650,
        strictAltitude: true,
        botanicalPurity: '100% Nativo de la Mixteca libre OGM',
        agroecologicalFreePesticides: true,
        evidencePhotos,
        stellarTxLedger: mockLedger,
        stellarTxHash: mockTxHash,
        stellarTimestamp: timestamp,
        immutableSealStatus: 'Sellado Inmutable'
      }
    };

    const newLot: DigitalPassportLot = {
      ...baseLot,
      ...(customLot || {})
    };

    setLots((prev) => [newLot, ...prev]);
    setSelectedLot(newLot);
  };

  const totalCartCount = cartItems.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <div
      className={`min-h-screen bg-[#fcf9f3] text-[#1c1c18] flex flex-col justify-between selection:bg-[#ffdbd1] selection:text-[#3b0900] ${
        elderMode ? 'text-[17px]' : ''
      }`}
    >
      {/* Top Application Bar */}
      <TopAppBar
        currentTab={currentTab}
        currentScreen={currentScreen}
        onNavigateScreen={handleNavigateScreen}
        onOpenCart={() => setIsCartModalOpen(true)}
        onOpenMicDiagnostic={() => setIsMicDiagnosticModalOpen(true)}
        cartCount={totalCartCount}
        appLanguage={appLanguage}
        onToggleLanguage={() => setAppLanguage((prev) => (prev === 'es' ? 'mix' : 'es'))}
        elderMode={elderMode}
        onToggleElderMode={() => setElderMode((prev) => !prev)}
        isOnline={isOnline}
      />

      {/* Persistent Offline Banner: Only rendered when there is NO internet */}
      {!isOnline && (
        <div className="w-full bg-[#a73918] text-white px-3.5 py-2 text-[12px] font-extrabold flex items-center justify-between shadow-md border-b-2 border-amber-300 z-30 animate-pulse">
          <div className="flex items-center gap-2 max-w-[85%]">
            <span className="material-symbols-outlined text-[20px] text-amber-200">wifi_off</span>
            <span>
              <strong>Modo Parcela Activo:</strong> Sin conexión a internet. Tus cosechas, notas de voz y fotos se guardan en la memoria de este teléfono.
            </span>
          </div>
          <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-wider font-black">
            Offline
          </span>
        </div>
      )}

      {/* Screen Routing */}
      {currentTab === 'menu' && currentScreen === 'menu_principal' && (
        <MainMenuScreen
          onNavigateScreen={handleNavigateScreen}
          onOpenLots={() => setIsLotsModalOpen(true)}
          onOpenPayments={() => setIsPaymentsModalOpen(true)}
          onOpenMap={() => setIsMapModalOpen(true)}
          onOpenMicDiagnostic={() => setIsMicDiagnosticModalOpen(true)}
          appLanguage={appLanguage}
          elderMode={elderMode}
          isOnline={isOnline}
          onOpenTechHelp={() => {
            setTargetChatProducer('Equipo de Asistencia Técnica');
            setCurrentTab('chat');
            setCurrentScreen('registro_productor');
          }}
        />
      )}

      {currentScreen === 'catalogo_producto' && (
        <ProductTypeCatalogScreen
          onSelectProduct={(name) => {
            setSelectedProductType(sanitizeProductName(name));
          }}
          onNavigateScreen={handleNavigateScreen}
          elderMode={elderMode}
          appLanguage={appLanguage}
        />
      )}

      {currentScreen === 'registrar_lote_cafe' && (
        <RegisterCoffeeLotScreen
          selectedProductType={selectedProductType}
          onNavigateScreen={handleNavigateScreen}
          onLotCreated={handleLotCreated}
          elderMode={elderMode}
          appLanguage={appLanguage}
          isOnline={isOnline}
        />
      )}

      {currentScreen === 'pasaporte_digital' && (
        <DigitalPassportScreen
          lot={selectedLot}
          onNavigateScreen={handleNavigateScreen}
          onOpenDictamen={() => setIsDictamenModalOpen(true)}
          onDirectMessageProducer={handleDirectContact}
          onAddToCart={handleAddToCart}
          elderMode={elderMode}
          appLanguage={appLanguage}
        />
      )}

      {currentTab === 'chat' && currentScreen === 'registro_productor' && (
        <ChatScreen
          onNavigateScreen={handleNavigateScreen}
          targetProducer={targetChatProducer}
          initialCustomMessage={chatInitialMessage}
          onOpenDictamenModal={() => setIsDictamenModalOpen(true)}
          onOpenLotsModal={() => setIsLotsModalOpen(true)}
          onOpenPaymentsModal={() => setIsPaymentsModalOpen(true)}
          onOpenCartModal={() => setIsCartModalOpen(true)}
          onOpenMapModal={() => setIsMapModalOpen(true)}
          onOpenMicDiagnosticModal={() => setIsMicDiagnosticModalOpen(true)}
          onAddToCart={handleAddToCart}
          selectedLot={selectedLot}
        />
      )}

      {currentTab === 'productos' && currentScreen === 'vitrina_productos' && (
        <BuyerShowcaseScreen
          products={products}
          onNavigateScreen={handleNavigateScreen}
          onAddToCart={handleAddToCart}
          onDirectContact={handleDirectContact}
        />
      )}

      {/* Bottom Navigation Bar */}
      <BottomNavBar currentTab={currentTab} onSelectTab={handleTabChange} />

      {/* Modals */}
      <MyLotsModal
        isOpen={isLotsModalOpen}
        onClose={() => setIsLotsModalOpen(false)}
        lots={lots}
        onSelectLot={(lot) => {
          setSelectedLot(lot);
          setCurrentTab('productos');
          setCurrentScreen('pasaporte_digital');
        }}
        onRegisterNewLot={() => handleNavigateScreen('catalogo_producto')}
      />

      <MyPaymentsModal
        isOpen={isPaymentsModalOpen}
        onClose={() => setIsPaymentsModalOpen(false)}
        onRequestWithdrawal={(amount) => {
          setTargetChatProducer('Raíz - Tesorería');
          setChatInitialMessage(
            `Hola, solicito formalmente el retiro de mis $${amount.toLocaleString('es-MX', {
              minimumFractionDigits: 2
            })} MXN de saldo acumulado de cosechas para cobro en Tlaxiaco.`
          );
          setCurrentTab('chat');
          setCurrentScreen('registro_productor');
        }}
        onNavigateToLots={() => setIsLotsModalOpen(true)}
      />

      <NormativeCertificateModal
        isOpen={isDictamenModalOpen}
        lot={selectedLot}
        onClose={() => setIsDictamenModalOpen(false)}
        onShareInChat={(lot) => {
          setTargetChatProducer('Asesoría Técnica Raíz');
          setChatInitialMessage(
            `Hola equipo técnico, tengo una consulta sobre el Dictamen Normativo del lote ${lot.title} (Folio #${lot.code}).`
          );
          setCurrentTab('chat');
          setCurrentScreen('registro_productor');
        }}
      />

      <CartModal
        isOpen={isCartModalOpen}
        onClose={() => setIsCartModalOpen(false)}
        items={cartItems}
        onRemoveItem={handleRemoveFromCart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onClearCart={handleClearCart}
        onOrderConfirmed={(summary) => {
          setTargetChatProducer('Raíz - Pedidos');
          setChatInitialMessage(
            `Confirmación de pedido directo: ${summary}. Deseo coordinar la entrega comunitaria desde la Mixteca.`
          );
          setCurrentTab('chat');
          setCurrentScreen('registro_productor');
        }}
        onExploreProducts={() => handleNavigateScreen('vitrina_productos')}
      />

      <RegionalMapModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        onSelectCommunity={(name) => {
          setIsLotsModalOpen(true);
        }}
      />

      <MicrophoneDiagnosticModal
        isOpen={isMicDiagnosticModalOpen}
        onClose={() => setIsMicDiagnosticModalOpen(false)}
      />
    </div>
  );
}
