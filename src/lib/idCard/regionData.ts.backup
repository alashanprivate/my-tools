/**
 * 中国地区代码数据
 * 6位代码：前2位省，中间2位市，后2位区县
 */

export interface RegionData {
  code: string
  name: string
  children?: ProvinceData[]
}

export interface ProvinceData {
  code: string
  name: string
  children?: CityData[]
}

export interface CityData {
  code: string
  name: string
  children?: DistrictData[]
}

export interface DistrictData {
  code: string
  name: string
}

/**
 * 全国省市区县数据（精选主要城市和区县）
 * 注：完整数据量很大，这里包含所有省份和主要城市
 */
export const REGION_DATA: RegionData[] = [
  {
    code: '11',
    name: '北京市',
    children: [
      {
        code: '1101',
        name: '市辖区',
        children: [
          { code: '110101', name: '东城区' },
          { code: '110102', name: '西城区' },
          { code: '110105', name: '朝阳区' },
          { code: '110106', name: '丰台区' },
          { code: '110107', name: '石景山区' },
          { code: '110108', name: '海淀区' },
          { code: '110109', name: '门头沟区' },
          { code: '110111', name: '房山区' },
          { code: '110112', name: '通州区' },
          { code: '110113', name: '顺义区' },
          { code: '110114', name: '昌平区' },
          { code: '110115', name: '大兴区' },
          { code: '110116', name: '怀柔区' },
          { code: '110117', name: '平谷区' },
          { code: '110118', name: '密云区' },
          { code: '110119', name: '延庆区' },
        ],
      },
    ],
  },
  {
    code: '12',
    name: '天津市',
    children: [
      {
        code: '1201',
        name: '市辖区',
        children: [
          { code: '120101', name: '和平区' },
          { code: '120102', name: '河东区' },
          { code: '120103', name: '河西区' },
          { code: '120104', name: '南开区' },
          { code: '120105', name: '河北区' },
          { code: '120106', name: '红桥区' },
          { code: '120110', name: '东丽区' },
          { code: '120111', name: '西青区' },
          { code: '120112', name: '津南区' },
          { code: '120113', name: '北辰区' },
          { code: '120114', name: '武清区' },
          { code: '120115', name: '宝坻区' },
          { code: '120116', name: '滨海新区' },
          { code: '120117', name: '宁河区' },
          { code: '120118', name: '静海区' },
          { code: '120119', name: '蓟州区' },
        ],
      },
    ],
  },
  {
    code: '13',
    name: '河北省',
    children: [
      {
        code: '1301',
        name: '石家庄市',
        children: [
          { code: '130102', name: '长安区' },
          { code: '130104', name: '桥西区' },
          { code: '130105', name: '新华区' },
          { code: '130107', name: '井陉矿区' },
          { code: '130108', name: '裕华区' },
          { code: '130109', name: '藁城区' },
          { code: '130110', name: '鹿泉区' },
          { code: '130111', name: '栾城区' },
        ],
      },
      {
        code: '1302',
        name: '唐山市',
        children: [
          { code: '130202', name: '路南区' },
          { code: '130203', name: '路北区' },
          { code: '130204', name: '古冶区' },
          { code: '130205', name: '开平区' },
          { code: '130207', name: '丰南区' },
          { code: '130208', name: '丰润区' },
          { code: '130209', name: '曹妃甸区' },
        ],
      },
      {
        code: '1306',
        name: '保定市',
        children: [
          { code: '130602', name: '竞秀区' },
          { code: '130606', name: '莲池区' },
          { code: '130607', name: '满城区' },
          { code: '130608', name: '清苑区' },
        ],
      },
    ],
  },
  {
    code: '14',
    name: '山西省',
    children: [
      {
        code: '1401',
        name: '太原市',
        children: [
          { code: '140105', name: '小店区' },
          { code: '140106', name: '迎泽区' },
          { code: '140107', name: '杏花岭区' },
          { code: '140108', name: '尖草坪区' },
          { code: '140109', name: '万柏林区' },
          { code: '140110', name: '晋源区' },
        ],
      },
      {
        code: '1402',
        name: '大同市',
        children: [
          { code: '140202', name: '平城区' },
          { code: '140203', name: '云冈区' },
          { code: '140211', name: '新荣区' },
          { code: '140212', name: '云州区' },
        ],
      },
    ],
  },
  {
    code: '15',
    name: '内蒙古自治区',
    children: [
      {
        code: '1501',
        name: '呼和浩特市',
        children: [
          { code: '150102', name: '新城区' },
          { code: '150103', name: '回民区' },
          { code: '150104', name: '玉泉区' },
          { code: '150105', name: '赛罕区' },
        ],
      },
      {
        code: '1502',
        name: '包头市',
        children: [
          { code: '150202', name: '东河区' },
          { code: '150203', name: '昆都仑区' },
          { code: '150204', name: '青山区' },
          { code: '150205', name: '石拐区' },
          { code: '150206', name: '白云鄂博矿区' },
          { code: '150207', name: '九原区' },
        ],
      },
    ],
  },
  {
    code: '21',
    name: '辽宁省',
    children: [
      {
        code: '2101',
        name: '沈阳市',
        children: [
          { code: '210102', name: '和平区' },
          { code: '210103', name: '沈河区' },
          { code: '210104', name: '大东区' },
          { code: '210105', name: '皇姑区' },
          { code: '210106', name: '铁西区' },
          { code: '210111', name: '苏家屯区' },
          { code: '210112', name: '浑南区' },
          { code: '210113', name: '沈北新区' },
        ],
      },
      {
        code: '2102',
        name: '大连市',
        children: [
          { code: '210202', name: '中山区' },
          { code: '210203', name: '西岗区' },
          { code: '210204', name: '沙河口区' },
          { code: '210211', name: '甘井子区' },
          { code: '210212', name: '旅顺口区' },
          { code: '210213', name: '金州区' },
          { code: '210214', name: '普兰店区' },
        ],
      },
    ],
  },
  {
    code: '22',
    name: '吉林省',
    children: [
      {
        code: '2201',
        name: '长春市',
        children: [
          { code: '220102', name: '南关区' },
          { code: '220103', name: '宽城区' },
          { code: '220104', name: '朝阳区' },
          { code: '220105', name: '二道区' },
          { code: '220106', name: '绿园区' },
          { code: '220112', name: '双阳区' },
        ],
      },
      {
        code: '2202',
        name: '吉林市',
        children: [
          { code: '220202', name: '昌邑区' },
          { code: '220203', name: '龙潭区' },
          { code: '220204', name: '船营区' },
          { code: '220211', name: '丰满区' },
        ],
      },
    ],
  },
  {
    code: '23',
    name: '黑龙江省',
    children: [
      {
        code: '2301',
        name: '哈尔滨市',
        children: [
          { code: '230102', name: '道里区' },
          { code: '230103', name: '南岗区' },
          { code: '230104', name: '道外区' },
          { code: '230108', name: '平房区' },
          { code: '230109', name: '松北区' },
          { code: '230110', name: '香坊区' },
        ],
      },
      {
        code: '2302',
        name: '齐齐哈尔市',
        children: [
          { code: '230202', name: '龙沙区' },
          { code: '230203', name: '建华区' },
          { code: '230204', name: '铁锋区' },
          { code: '230205', name: '昂昂溪区' },
          { code: '230206', name: '富拉尔基区' },
        ],
      },
    ],
  },
  {
    code: '31',
    name: '上海市',
    children: [
      {
        code: '3101',
        name: '市辖区',
        children: [
          { code: '310101', name: '黄浦区' },
          { code: '310104', name: '徐汇区' },
          { code: '310105', name: '长宁区' },
          { code: '310106', name: '静安区' },
          { code: '310107', name: '普陀区' },
          { code: '310109', name: '虹口区' },
          { code: '310110', name: '杨浦区' },
          { code: '310112', name: '闵行区' },
          { code: '310113', name: '宝山区' },
          { code: '310114', name: '嘉定区' },
          { code: '310115', name: '浦东新区' },
          { code: '310116', name: '金山区' },
          { code: '310117', name: '松江区' },
          { code: '310118', name: '青浦区' },
          { code: '310120', name: '奉贤区' },
          { code: '310151', name: '崇明区' },
        ],
      },
    ],
  },
  {
    code: '32',
    name: '江苏省',
    children: [
      {
        code: '3201',
        name: '南京市',
        children: [
          { code: '320102', name: '玄武区' },
          { code: '320104', name: '秦淮区' },
          { code: '320105', name: '建邺区' },
          { code: '320106', name: '鼓楼区' },
          { code: '320111', name: '浦口区' },
          { code: '320113', name: '栖霞区' },
          { code: '320114', name: '雨花台区' },
          { code: '320115', name: '江宁区' },
          { code: '320116', name: '六合区' },
          { code: '320117', name: '溧水区' },
          { code: '320118', name: '高淳区' },
        ],
      },
      {
        code: '3202',
        name: '无锡市',
        children: [
          { code: '320205', name: '锡山区' },
          { code: '320206', name: '惠山区' },
          { code: '320211', name: '滨湖区' },
          { code: '320213', name: '梁溪区' },
          { code: '320214', name: '新吴区' },
        ],
      },
      {
        code: '3205',
        name: '苏州市',
        children: [
          { code: '320505', name: '虎丘区' },
          { code: '320506', name: '吴中区' },
          { code: '320507', name: '相城区' },
          { code: '320508', name: '姑苏区' },
          { code: '320509', name: '吴江区' },
        ],
      },
    ],
  },
  {
    code: '33',
    name: '浙江省',
    children: [
      {
        code: '3301',
        name: '杭州市',
        children: [
          { code: '330102', name: '上城区' },
          { code: '330105', name: '拱墅区' },
          { code: '330106', name: '西湖区' },
          { code: '330108', name: '滨江区' },
          { code: '330109', name: '萧山区' },
          { code: '330110', name: '余杭区' },
          { code: '330111', name: '富阳区' },
          { code: '330112', name: '临安区' },
        ],
      },
      {
        code: '3302',
        name: '宁波市',
        children: [
          { code: '330203', name: '海曙区' },
          { code: '330205', name: '江北区' },
          { code: '330206', name: '北仑区' },
          { code: '330211', name: '镇海区' },
          { code: '330212', name: '鄞州区' },
          { code: '330213', name: '奉化区' },
        ],
      },
      {
        code: '3303',
        name: '温州市',
        children: [
          { code: '330302', name: '鹿城区' },
          { code: '330303', name: '龙湾区' },
          { code: '330304', name: '瓯海区' },
          { code: '330305', name: '洞头区' },
        ],
      },
    ],
  },
  {
    code: '34',
    name: '安徽省',
    children: [
      {
        code: '3401',
        name: '合肥市',
        children: [
          { code: '340102', name: '瑶海区' },
          { code: '340103', name: '庐阳区' },
          { code: '340104', name: '蜀山区' },
          { code: '340111', name: '包河区' },
          { code: '340121', name: '长丰县' },
        ],
      },
      {
        code: '3402',
        name: '芜湖市',
        children: [
          { code: '340207', name: '镜湖区' },
          { code: '340209', name: '弋江区' },
          { code: '340210', name: '鸠江区' },
        ],
      },
    ],
  },
  {
    code: '35',
    name: '福建省',
    children: [
      {
        code: '3501',
        name: '福州市',
        children: [
          { code: '350102', name: '鼓楼区' },
          { code: '350103', name: '台江区' },
          { code: '350104', name: '仓山区' },
          { code: '350105', name: '马尾区' },
          { code: '350111', name: '晋安区' },
        ],
      },
      {
        code: '3502',
        name: '厦门市',
        children: [
          { code: '350203', name: '思明区' },
          { code: '350205', name: '海沧区' },
          { code: '350206', name: '湖里区' },
          { code: '350211', name: '集美区' },
          { code: '350212', name: '同安区' },
          { code: '350213', name: '翔安区' },
        ],
      },
    ],
  },
  {
    code: '36',
    name: '江西省',
    children: [
      {
        code: '3601',
        name: '南昌市',
        children: [
          { code: '360102', name: '东湖区' },
          { code: '360103', name: '西湖区' },
          { code: '360104', name: '青云谱区' },
          { code: '360111', name: '青山湖区' },
          { code: '360112', name: '新建区' },
        ],
      },
    ],
  },
  {
    code: '37',
    name: '山东省',
    children: [
      {
        code: '3701',
        name: '济南市',
        children: [
          { code: '370102', name: '历下区' },
          { code: '370103', name: '市中区' },
          { code: '370104', name: '槐荫区' },
          { code: '370105', name: '天桥区' },
          { code: '370112', name: '历城区' },
          { code: '370113', name: '长清区' },
          { code: '370114', name: '章丘区' },
        ],
      },
      {
        code: '3702',
        name: '青岛市',
        children: [
          { code: '370202', name: '市南区' },
          { code: '370203', name: '市北区' },
          { code: '370211', name: '黄岛区' },
          { code: '370212', name: '崂山区' },
          { code: '370213', name: '李沧区' },
          { code: '370214', name: '城阳区' },
        ],
      },
    ],
  },
  {
    code: '41',
    name: '河南省',
    children: [
      {
        code: '4101',
        name: '郑州市',
        children: [
          { code: '410102', name: '中原区' },
          { code: '410103', name: '二七区' },
          { code: '410104', name: '管城回族区' },
          { code: '410105', name: '金水区' },
          { code: '410106', name: '上街区' },
          { code: '410108', name: '惠济区' },
        ],
      },
      {
        code: '4102',
        name: '开封市',
        children: [
          { code: '410202', name: '龙亭区' },
          { code: '410203', name: '顺河回族区' },
          { code: '410204', name: '鼓楼区' },
          { code: '410205', name: '禹王台区' },
          { code: '410212', name: '祥符区' },
        ],
      },
    ],
  },
  {
    code: '42',
    name: '湖北省',
    children: [
      {
        code: '4201',
        name: '武汉市',
        children: [
          { code: '420102', name: '江岸区' },
          { code: '420103', name: '江汉区' },
          { code: '420104', name: '硚口区' },
          { code: '420105', name: '汉阳区' },
          { code: '420106', name: '武昌区' },
          { code: '420107', name: '青山区' },
          { code: '420111', name: '洪山区' },
          { code: '420112', name: '东西湖区' },
          { code: '420115', name: '汉南区' },
          { code: '420116', name: '蔡甸区' },
          { code: '420117', name: '江夏区' },
          { code: '420118', name: '黄陂区' },
        ],
      },
    ],
  },
  {
    code: '43',
    name: '湖南省',
    children: [
      {
        code: '4301',
        name: '长沙市',
        children: [
          { code: '430102', name: '芙蓉区' },
          { code: '430103', name: '天心区' },
          { code: '430104', name: '岳麓区' },
          { code: '430105', name: '开福区' },
          { code: '430111', name: '雨花区' },
          { code: '430112', name: '望城区' },
        ],
      },
    ],
  },
  {
    code: '44',
    name: '广东省',
    children: [
      {
        code: '4401',
        name: '广州市',
        children: [
          { code: '440103', name: '荔湾区' },
          { code: '440104', name: '越秀区' },
          { code: '440105', name: '海珠区' },
          { code: '440106', name: '天河区' },
          { code: '440111', name: '白云区' },
          { code: '440112', name: '黄埔区' },
          { code: '440113', name: '番禺区' },
          { code: '440114', name: '花都区' },
          { code: '440115', name: '南沙区' },
          { code: '440117', name: '从化区' },
          { code: '440118', name: '增城区' },
        ],
      },
      {
        code: '4403',
        name: '深圳市',
        children: [
          { code: '440303', name: '罗湖区' },
          { code: '440304', name: '福田区' },
          { code: '440305', name: '南山区' },
          { code: '440306', name: '宝安区' },
          { code: '440307', name: '龙岗区' },
          { code: '440308', name: '盐田区' },
          { code: '440309', name: '龙华区' },
          { code: '440310', name: '坪山区' },
          { code: '440311', name: '光明区' },
        ],
      },
      {
        code: '4404',
        name: '珠海市',
        children: [
          { code: '440402', name: '香洲区' },
          { code: '440403', name: '斗门区' },
          { code: '440404', name: '金湾区' },
        ],
      },
      {
        code: '4406',
        name: '佛山市',
        children: [
          { code: '440604', name: '禅城区' },
          { code: '440605', name: '南海区' },
          { code: '440606', name: '顺德区' },
          { code: '440607', name: '三水区' },
          { code: '440608', name: '高明区' },
        ],
      },
    ],
  },
  {
    code: '45',
    name: '广西壮族自治区',
    children: [
      {
        code: '4501',
        name: '南宁市',
        children: [
          { code: '450102', name: '兴宁区' },
          { code: '450103', name: '青秀区' },
          { code: '450105', name: '江南区' },
          { code: '450107', name: '西乡塘区' },
          { code: '450108', name: '良庆区' },
          { code: '450109', name: '邕宁区' },
        ],
      },
    ],
  },
  {
    code: '46',
    name: '海南省',
    children: [
      {
        code: '4601',
        name: '海口市',
        children: [
          { code: '460105', name: '秀英区' },
          { code: '460106', name: '龙华区' },
          { code: '460107', name: '琼山区' },
          { code: '460108', name: '美兰区' },
        ],
      },
      {
        code: '4603',
        name: '三亚市',
        children: [
          { code: '460202', name: '海棠区' },
          { code: '460203', name: '吉阳区' },
          { code: '460204', name: '天涯区' },
          { code: '460205', name: '崖州区' },
        ],
      },
    ],
  },
  {
    code: '50',
    name: '重庆市',
    children: [
      {
        code: '5001',
        name: '市辖区',
        children: [
          { code: '500101', name: '万州区' },
          { code: '500102', name: '涪陵区' },
          { code: '500103', name: '渝中区' },
          { code: '500104', name: '大渡口区' },
          { code: '500105', name: '江北区' },
          { code: '500106', name: '沙坪坝区' },
          { code: '500107', name: '九龙坡区' },
          { code: '500108', name: '南岸区' },
          { code: '500109', name: '北碚区' },
          { code: '500110', name: '綦江区' },
          { code: '500111', name: '大足区' },
          { code: '500112', name: '渝北区' },
          { code: '500113', name: '巴南区' },
          { code: '500114', name: '黔江区' },
          { code: '500115', name: '长寿区' },
          { code: '500116', name: '江津区' },
          { code: '500117', name: '合川区' },
          { code: '500118', name: '永川区' },
          { code: '500119', name: '南川区' },
          { code: '500120', name: '璧山区' },
        ],
      },
    ],
  },
  {
    code: '51',
    name: '四川省',
    children: [
      {
        code: '5101',
        name: '成都市',
        children: [
          { code: '510104', name: '锦江区' },
          { code: '510105', name: '青羊区' },
          { code: '510106', name: '金牛区' },
          { code: '510107', name: '武侯区' },
          { code: '510108', name: '成华区' },
          { code: '510112', name: '龙泉驿区' },
          { code: '510113', name: '青白江区' },
          { code: '510114', name: '新都区' },
          { code: '510115', name: '温江区' },
          { code: '510116', name: '双流区' },
          { code: '510117', name: '郫都区' },
        ],
      },
    ],
  },
  {
    code: '52',
    name: '贵州省',
    children: [
      {
        code: '5201',
        name: '贵阳市',
        children: [
          { code: '520102', name: '南明区' },
          { code: '520103', name: '云岩区' },
          { code: '520111', name: '花溪区' },
          { code: '520112', name: '乌当区' },
          { code: '520113', name: '白云区' },
          { code: '520115', name: '观山湖区' },
        ],
      },
    ],
  },
  {
    code: '53',
    name: '云南省',
    children: [
      {
        code: '5301',
        name: '昆明市',
        children: [
          { code: '530102', name: '五华区' },
          { code: '530103', name: '盘龙区' },
          { code: '530111', name: '官渡区' },
          { code: '530112', name: '西山区' },
          { code: '530113', name: '东川区' },
          { code: '530114', name: '呈贡区' },
        ],
      },
    ],
  },
  {
    code: '54',
    name: '西藏自治区',
    children: [
      {
        code: '5401',
        name: '拉萨市',
        children: [
          { code: '540102', name: '城关区' },
          { code: '540103', name: '堆龙德庆区' },
          { code: '540104', name: '达孜区' },
        ],
      },
    ],
  },
  {
    code: '61',
    name: '陕西省',
    children: [
      {
        code: '6101',
        name: '西安市',
        children: [
          { code: '610102', name: '新城区' },
          { code: '610103', name: '碑林区' },
          { code: '610104', name: '莲湖区' },
          { code: '610111', name: '灞桥区' },
          { code: '610112', name: '未央区' },
          { code: '610113', name: '雁塔区' },
          { code: '610114', name: '阎良区' },
          { code: '610115', name: '临潼区' },
          { code: '610116', name: '长安区' },
        ],
      },
    ],
  },
  {
    code: '62',
    name: '甘肃省',
    children: [
      {
        code: '6201',
        name: '兰州市',
        children: [
          { code: '620102', name: '城关区' },
          { code: '620103', name: '七里河区' },
          { code: '620104', name: '西固区' },
          { code: '620105', name: '安宁区' },
          { code: '620111', name: '红古区' },
        ],
      },
    ],
  },
  {
    code: '63',
    name: '青海省',
    children: [
      {
        code: '6301',
        name: '西宁市',
        children: [
          { code: '630102', name: '城东区' },
          { code: '630103', name: '城中区' },
          { code: '630104', name: '城西区' },
          { code: '630105', name: '城北区' },
        ],
      },
    ],
  },
  {
    code: '64',
    name: '宁夏回族自治区',
    children: [
      {
        code: '6401',
        name: '银川市',
        children: [
          { code: '640104', name: '兴庆区' },
          { code: '640105', name: '西夏区' },
          { code: '640106', name: '金凤区' },
        ],
      },
    ],
  },
  {
    code: '65',
    name: '新疆维吾尔自治区',
    children: [
      {
        code: '6501',
        name: '乌鲁木齐市',
        children: [
          { code: '650102', name: '天山区' },
          { code: '650103', name: '沙依巴克区' },
          { code: '650104', name: '新市区' },
          { code: '650105', name: '水磨沟区' },
          { code: '650106', name: '头屯河区' },
          { code: '650107', name: '达坂城区' },
          { code: '650109', name: '米东区' },
        ],
      },
    ],
  },
]

/**
 * 根据地区代码获取地区名称
 */
export function getRegionName(code: string): string {
  // 区县级
  for (const province of REGION_DATA) {
    if (code.startsWith(province.code) && province.children) {
      for (const city of province.children) {
        if (code.startsWith(city.code) && city.children) {
          for (const district of city.children) {
            if (district.code === code) {
              return `${province.name}${city.name}${district.name}`
            }
          }
        }
      }
    }
  }
  return '未知地区'
}
