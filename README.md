#TypeScript-vue-learn

> 这个介绍是我从网上参考复制而来, 目前的仓库内容还不算成熟，先备忘下来，等后面把ts用起来之后再逐步完善

## 一、关于选型

在做了一些技术调研后，再结合项目之后的开发量级以及维护成本。最终我和同事在技术选型上得出一致结论，最终选型定为 Vue 最新全家桶 + TypeScript。

1. 首先，TypeScript 具有类型系统，且是 JavaScript 的超集。 JavaScript 能做的，它能做。JavaScript 不能做的，它也能做。
2. 其次，TypeScript 已经比较成熟了，市面上相关资料也比较多，大部分的库和框架也读对 TypeScript 做了很好的支持。
3. 然后，保证优秀的前提下，它还在积极的开发完善之中，不断地会有新的特性加入进来
4. JavaScript 是弱类型并且没有命名空间，导致很难模块化，使得其在大型的协作项目中不是很方便
5. vscode、ws 等编辑器对 TypeScript 支持很友好
6. TypeScript 在组件以及业务的类型校验上支持比较好，比如

    ```typescript
    // 定义枚举
    const enum StateEnum {
      TO_BE_DONE = 0,
      DOING = 1,
      DONE = 2
    }
    
    // 定义 item 接口
    interface SrvItem {
      val: string,
      key: string
    }
    
    // 定义服务接口
    interface SrvType {
      name: string,
      key: string,
      state?: StateEnum,
      item: Array<SrvItem>
    }
    
    // 然后定义初始值（如果不按照类型来，报错肯定是避免不了的）
    const types: SrvType = {
      name: '',
      key: '',
      item: []
    }
    ```
    
    配合好编辑器，如果不按照定义好的类型来的话，编辑器本身就会给你报错，而不会等到编译才来报错

7. 命令空间 + 接口申明更方便类型校验，防止代码的不规范

    比如，你在一个 ajax.d.ts 文件定义了 ajax 的返回类型
    
    ```typescript
    declare namespace Ajax {
      // axios 返回数据
      export interface AxiosResponse {
        data: AjaxResponse
      }
    
      // 请求接口数据
      export interface AjaxResponse {
        code: number,
        data: object | null | Array<any>,
        message: string
      }
    }
    ```
    
    然后在请求的时候就能进行使用
    
    ```typescript
    this.axiosRequest({ key: 'idc' }).then((res: Ajax.AjaxResponse) => {
      console.log(res)
    })
    ```

8. 可以使用 泛型 来创建可重用的组件。比如你想创建一个参数类型和返回值类型是一样的通用方法

    ```typescript
    function foo<T> (arg: T): T {
      return arg
    }
    let output = foo('string') // type of output will be 'string'
    ```
    
    再比如，你想使用泛型来锁定代码里使用的类型
    
    ```typescript
    interface GenericInterface<T> {
      (arg: T): T
    }
    
    function foo<T> (arg: T): T {
      return arg
    }
    
    // 锁定 myFoo 只能传入 number 类型的参数，传其他类型的参数则会报错
    let myFoo: GenericInterface<number> = foo
    myFoo(123)
    ```

总之，还有很多使用 TypeScript 的好处，这里我就不一一列举了，感兴趣的小伙伴可以自己去查资料


## 二、基础建设

### 1、初始化结构

我这边使用的是最新版本脚手架 vue-cli 3 进行项目初始化的，初始化选项如下

![](https://user-gold-cdn.xitu.io/2018/7/22/164c23a218cb8f45?w=1226&h=512&f=png&s=870648)

生成的目录结构如下

```shell
├── public                          // 静态页面
├── src                             // 主目录
    ├── assets                      // 静态资源
    ├── components                  // 组件
    ├── views                       // 页面
    ├── App.vue                     // 页面主入口
    ├── main.ts                     // 脚本主入口
    ├── registerServiceWorker.ts    // PWA 配置
    ├── router.ts                   // 路由
    ├── shims-tsx.d.ts              // 相关 tsx 模块注入
    ├── shims-vue.d.ts              // Vue 模块注入
    └── store.ts                    // vuex 配置
├── tests                           // 测试用例
├── .postcssrc.js                   // postcss 配置
├── package.json                    // 依赖
├── tsconfig.json                   // ts 配置
└── tslint.json                     // tslint 配置
```

### 2、改造后的结构

显然这些是不能够满足正常业务的开发的，所以我这边做了一版基础建设方面的改造。改造完后项目结构如下

```shell
├── public                          // 静态页面
├── scripts                         // 相关脚本配置
├── src                             // 主目录
    ├── assets                      // 静态资源
    ├── filters                     // 过滤
    ├── lib                         // 全局插件
    ├── router                      // 路由配置
    ├── store                       // vuex 配置
    ├── styles                      // 样式
    ├── types                       // 全局注入
    ├── utils                       // 工具方法(axios封装，全局方法等)
    ├── views                       // 页面
    ├── App.vue                     // 页面主入口
    ├── main.ts                     // 脚本主入口
    ├── registerServiceWorker.ts    // PWA 配置
├── tests                           // 测试用例
├── .editorconfig                   // 编辑相关配置
├── .npmrc                          // npm 源配置
├── .postcssrc.js                   // postcss 配置
├── babel.config.js                 // preset 记录
├── cypress.json                    // e2e plugins
├── f2eci.json                      // 部署相关配置
├── package.json                    // 依赖
├── README.md                       // 项目 readme
├── tsconfig.json                   // ts 配置
├── tslint.json                     // tslint 配置
└── vue.config.js                   // webpack 配置
```

### 3、模块改造

接下来，我将介绍项目中部分模块的改造

#### i、路由懒加载

这里使用了 webpack 的按需加载 import，将相同模块的东西放到同一个 chunk 里面，在 `router/index.ts` 中写入

```typescript
import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
  routes: [
    { path: '/', name: 'home', component: () => import(/* webpackChunkName: "home" */ 'views/home/index.vue') }
  ]
})
```

#### ii、axios 封装

在 `utils/config.ts` 中写入 `axios` 相关配置（只列举了一小部分，具体请小伙伴们自己根据自身业务进行配置）

```typescript
import http from 'http'
import https from 'https'
import qs from 'qs'
import { AxiosResponse, AxiosRequestConfig } from 'axios'

const axiosConfig: AxiosRequestConfig = {
  baseURL: '/',
  // 请求后的数据处理
  transformResponse: [function (data: AxiosResponse) {
    return data
  }],
  // 查询对象序列化函数
  paramsSerializer: function (params: any) {
    return qs.stringify(params)
  },
  // 超时设置s
  timeout: 30000,
  // 跨域是否带Token
  withCredentials: true,
  responseType: 'json',
  // xsrf 设置
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  // 最多转发数，用于node.js
  maxRedirects: 5,
  // 最大响应数据大小
  maxContentLength: 2000,
  // 自定义错误状态码范围
  validateStatus: function (status: number) {
    return status >= 200 && status < 300
  },
  // 用于node.js
  httpAgent: new http.Agent({ keepAlive: true }),
  httpsAgent: new https.Agent({ keepAlive: true })
}

export default axiosConfig
```

接下来，需要在 `utils/api.ts` 中做一些全局的拦截操作，这里我在拦截器里统一处理了取消重复请求，如果你的业务不需要，请自行去掉

```typescript
import axios from 'axios'
import config from './config'

// 取消重复请求
let pending: Array<{
  url: string,
  cancel: Function
}> = []
const cancelToken = axios.CancelToken
const removePending = (config) => {
  for (let p in pending) {
    let item: any = p
    let list: any = pending[p]
    // 当前请求在数组中存在时执行函数体
    if (list.url === config.url + '&' + config.method) {
      // 执行取消操作
      list.cancel()
      // 从数组中移除记录
      pending.splice(item, 1)
    }
  }
}

const service = axios.create(config)

// 添加请求拦截器
service.interceptors.request.use(
  config => {
    removePending(config)
    config.cancelToken = new cancelToken((c) => {
      pending.push({ url: config.url + '&request_type=' + config.method, cancel: c })
    })
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 返回状态判断(添加响应拦截器)
service.interceptors.response.use(
  res => {
    removePending(res.config)
    return res
  },
  error => {
    return Promise.reject(error)
  }
)

export default service
```

为了方便，我们还需要定义一套固定的 axios 返回的格式，这个我们直接定义在全局即可。在 `types/ajax.d.ts` 文件中写入

```typescript
declare namespace Ajax {
  // axios 返回数据
  export interface AxiosResponse {
    data: AjaxResponse
  }

  // 请求接口数据
  export interface AjaxResponse {
    code: number,
    data: any,
    message: string
  }
}
```

接下来，我们将会把所有的 `axios` 放到 `vuex` 的 `actions` 中做统一管理

#### iii、vuex 模块化管理

store 下面，一个文件夹代表一个模块，store 大致目录如下

```shell
├── home                            // 主目录
    ├── index.ts                    // vuex state getters mutations action 管理
    ├── interface.ts                // 接口管理
└── index.ts                        // vuex 主入口
```

在 `home/interface.ts` 中管理相关模块的接口

```typescript
export interface HomeContent {
  name: string
  m1?: boolean
}
export interface State {
  count: number,
  test1?: Array<HomeContent>
}
```

然后在 `home/index.ts` 定义相关 `vuex` 模块内容

```typescript
import request from '@/service'
import { State } from './interface'
import { Commit } from 'vuex'

interface GetTodayWeatherParam {
  city: string
}

const state: State = {
  count: 0,
  test1: []
}

const getters = {
  count: (state: State) => state.count,
  message: (state: State) => state.message
}

const mutations = {
  INCREMENT (state: State, num: number) {
    state.count += num
  }
}

const actions = {
  async getTodayWeather (context: { commit: Commit }, params: GetTodayWeatherParam) {
    return request.get('/api/weatherApi', { params: params })
  }
}

export default {
  state,
  getters,
  mutations,
  actions
}
```

然后我们就能在页面中使用了啦

```vue
<template>
  <div class="home">
    <p>{{ count }}</p>
    <el-button type="default" @click="INCREMENT(2)">INCREMENT</el-button>
    <el-button type="primary" @click="DECREMENT(2)">DECREMENT</el-button>
    <el-input v-model="city" placeholder="请输入城市" />
    <el-button type="danger" @click="getCityWeather(city)">获取天气</el-button>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { State, Getter, Mutation, Action } from 'vuex-class'

@Component
export default class Home extends Vue {
  city: string = '上海'
    
  @Getter('count') count: number
  @Mutation('INCREMENT') INCREMENT: Function
  @Mutation('DECREMENT') DECREMENT: Function
  @Action('getTodayWeather') getTodayWeather: Function

  getCityWeather (city: string) {
    this.getTodayWeather({ city: city }).then((res: Ajax.AjaxResponse) => {
      const { low, high, type } = res.data.forecast[0]
      this.$message.success(`${city}今日：${type} ${low} - ${high}`)
    })
  }
}
</script>
```

至于更多的改造，这里我就不再介绍了。接下来的小节将介绍一下 ts 在 vue 文件中的一些写法

## 三、vue 中 ts 的用法

### 1、vue-property-decorator

这里单页面组件的书写采用的是 [vue-property-decorator](https://github.com/kaorun343/vue-property-decorator) 库，该库完全依赖于 [vue-class-component](https://github.com/vuejs/vue-class-component) ，也是 vue 官方推荐的库。

单页面组件中，在 `@Component({})` 里面写 `props`、`data` 等调用起来极其不方便，而 `vue-property-decorator` 里面包含了 8 个装饰符则解决了此类问题，他们分别为

- `@Emit`		   指定事件 emit，可以使用此修饰符，也可以直接使用 `this.$emit()`
- `@Inject`          指定依赖注入）
- `@Mixins`          mixin 注入 
- `@Model`            指定 model
- `@Prop`              指定 Prop
- `@Provide`        指定 Provide
- `@Watch`            指定 Watch
- `@Component`    export from `vue-class-component`

举个🌰

```typescript
import {
  Component, Prop, Watch, Vue
} from 'vue-property-decorator'

@Component
export class MyComponent extends Vue {
  dataA: string = 'test'
    
  @Prop({ default: 0 })
  propA: number

  // watcher
  @Watch('child')
  onChildChanged (val: string, oldVal: string) {}
  @Watch('person', { immediate: true, deep: true })
  onPersonChanged (val: Person, oldVal: Person) {}

  // 其他修饰符详情见上面的 github 地址，这里就不一一做说明了
}
```

解析之后会变成

```javascript
export default {
  data () {
    return {
      dataA: 'test'
    }
  },
  props: {
    propA: {
      type: Number,
      default: 0
    }
  },
  watch: {
    'child': {
      handler: 'onChildChanged',
      immediate: false,
      deep: false
    },
    'person': {
      handler: 'onPersonChanged',
      immediate: true,
      deep: true
    }
  },
  methods: {
    onChildChanged (val, oldVal) {},
    onPersonChanged (val, oldVal) {}
  }
}
```

### 2、vuex-class

[vuex-class](https://github.com/ktsn/vuex-class/) 是一个基于 [Vue](https://github.com/vuejs/vue)、[Vuex](https://github.com/vuejs/vuex)、[vue-class-component](https://github.com/vuejs/vue-class-component) 的库，和 `vue-property-decorator` 一样，它也提供了4 个修饰符以及 namespace，解决了 vuex 在 .vue 文件中使用上的不便的问题。

- @State
- @Getter
- @Mutation
- @Action
- namespace

copy 一个官方的🌰

```typescript
import Vue from 'vue'
import Component from 'vue-class-component'
import {
  State,
  Getter,
  Action,
  Mutation,
  namespace
} from 'vuex-class'

const someModule = namespace('path/to/module')

@Component
export class MyComp extends Vue {
  @State('foo') stateFoo
  @State(state => state.bar) stateBar
  @Getter('foo') getterFoo
  @Action('foo') actionFoo
  @Mutation('foo') mutationFoo
  @someModule.Getter('foo') moduleGetterFoo

  // If the argument is omitted, use the property name
  // for each state/getter/action/mutation type
  @State foo
  @Getter bar
  @Action baz
  @Mutation qux

  created () {
    this.stateFoo // -> store.state.foo
    this.stateBar // -> store.state.bar
    this.getterFoo // -> store.getters.foo
    this.actionFoo({ value: true }) // -> store.dispatch('foo', { value: true })
    this.mutationFoo({ value: true }) // -> store.commit('foo', { value: true })
    this.moduleGetterFoo // -> store.getters['path/to/module/foo']
  }
}
```

到这里，ts 在 .vue 文件中的用法介绍的也差不多了。我也相信小伙伴看到这，对其大致的语法糖也有了一定的了解了

### 3、一些建议

- 如果定义了 `.d.ts` 文件，请重新启动服务让你的服务能够识别你定义的模块，并重启 vscode 让编辑器也能够识别（真的恶心）
- 设置好你的 `tsconfig` ，比如记得把 `strictPropertyInitialization` 设为 false，不然你定义一个变量就必须给它一个初始值。
- 千万管理好你的路由层级，不然到时连正则都拯救不了你
- 业务层面千万做好类型检测或者枚举定义，这样不仅便利了开发，还能在出了问题的时候迅速定位
- 跨模块使用 vuex，请直接使用 `rootGetters`
- 如果你需要改造某组件库主题，请单开一个文件进行集中管理，别一个组件分一个文件去改动，不然编译起来速度堪忧
- 能够复用团队其他人开发好的东西，尽量别去开发第二遍，不然到时浪费的可能就不是单纯的开发时间，还有 code review 的时间

诸如此类的还有一堆，但更多的得你们自己去探寻。接下来，我将谈谈大型项目中团队协作的一些规范

## 四、如何进行团队协作

一个大的项目，肯定是多人一起并行，里面不仅有前端团队的合作，还有与产品同学的需求探（si）讨（bi），以及和后端同学的联调，甚至于还需要自己或者依靠 SRE 进行一些服务的配置。

### 1、前端开发规范

既然项目是基于 vue + ts 的且是多人协作，那么开发规范肯定是必须的，这样可以让并行开发变的容易起来。下面，我从当时我制定的规范中抽出一些给小伙伴们做个参考（仅做参考哈）

**i. 页面开发摆放顺序**

- HTML
- TypeScript
- CSS

```vue
<template>
</template>

<script lang="ts">
</script>

<style lang="scss">
</style>
```

**ii. CSS 规则（使用 BEM 命名规则避免样式冲突，不使用 scoped）**

```vue
<template>
  <div class="home">
    <div class="home__count">{{ count }}</div>
    <div class="home__input"></div>
  </div>
</template>

<style lang="scss">
.home {
  text-align: center;
  &__count {}
  &__input {}
}
</style>
```

**iii. vue 文件中 TS 上下文顺序**

- data

- @Prop

- @State

- @Getter

- @Action

- @Mutation

- @Watch

- 生命周期钩子

  - beforeCreate（按照生命周期钩子从上到下）

  - created

  - beforeMount

  - mounted

  - beforeUpdate

  - updated

  - activated

  - deactivated

  - beforeDestroy

  - destroyed

  - errorCaptured（最后一个生命周期钩子）

- 路由钩子

  - beforeRouteEnter

  - beforeRouteUpdate

  - beforeRouteLeave

- computed

- methods

组件引用，mixins，filters 等放在 @Component 里面

```vue
<script lang="ts">
@Component({
  components: { HelloWorld },
  mixins: [ Emitter ]
})
export default class Home extends Vue {
  city: string = '上海'

  @Prop({ type: [ Number, String ], default: 16 })
  size: number | string
  @State('state') state: StateInterface
  @Getter('count') count: Function
  @Action('getTodayWeather') getTodayWeather: Function
  @Mutation('DECREMENT') DECREMENT: Function
  
  @Watch('count')
  onWatchCount (val: number) {
    console.log('onWatchCount', val)
  }
  
  // computed
  get styles () {}
  
  created () {}
  mounted () {}
  destroyed () {}

  // methods
  getCityWeather (city: string) {}
}
</script>
```



**iv. vuex 模块化管理**

store 下面一个文件夹对应一个模块，每一个模块都有一个 interface 进行接口管理，具体例子上文中有提到

**v. 路由引入姿势**

路由懒加载，上文中也有例子

**vi. 文件命名规范**

单词小写，单词之间用 '-' 分隔，如图

![](https://user-gold-cdn.xitu.io/2018/7/22/164c23b109f8f1c9?w=528&h=882&f=png&s=186039)

名词在前，动词在后，如图

![](https://user-gold-cdn.xitu.io/2018/7/22/164c23b8ae65101b?w=526&h=102&f=png&s=34077)

相同模块描述在前，不同描述在后

![](https://user-gold-cdn.xitu.io/2018/7/22/164c23bb2466039f?w=472&h=128&f=png&s=47517)

### 2、其他工种协作

1. 跟产品要第一时间把不合理需求给顶回去，排期一定要自己确定

2. 跟后端约定的所有字段要有文档 有文档 有文档！

3. 要非常有礼貌的探（si）讨（bi), 有问题要沟通优先，别等到有锅后再探（si）讨（bi)

具体细节我曾在知乎里面有过回答，这里不赘述了。传送门：[前后端分离，后台返回的数据前端没法写，怎么办？](https://www.zhihu.com/question/61415974/answer/187589565)

### 3、人效提升

需求一下来，首先我们得保证的就是自己对需求的认知。一般对于老手来说，把需求过一遍心里就大致清楚做完这个需求大概需要多少时间，而新手则永远对完成时间没有一个很好的认知。

首先团队需要有个完整的/共同约定好的开发流程：

- UI图给到的时间节点 工作量评审
- 后端接口约定及mock数据
- 前端开发，需求确认/变更风险
- UI走查和细节跳转(文案等)
- 前后端接口联调
- 提测前流程梳理，避免阻碍测试性的bug
- 提交测试+修改bug
- 经产品确认后上线，报备

那么，如何提升自己的开发效率呢？

- 评估技术方案可能性，避免重大错误
- 把需求拆分成模块
- 把模块中的东西再次拆分成小细节
- 评估小细节自身的开发时间
- 评估小细节中某些可能存在的风险点的开发时间
- 评估联调时间和联调风险
- 预留测试 + 修复 BUG 的时间节点
- 预留 buffer （一般来说是 1  *（1 + 0.2））
- 安排好自己的开发节点，以 1D（一天）作为单位
- 如若预感要延期，需及时给出补救方案（比如：加班 重新排期）
- 记录 BUG 数量，以及对应的解 BUG 人员 最好有公共维护的文档可查（真的不是为了甩锅）

## 总结

学习了微软在vue项目中引入TS的过程，并探究了大型项目使用Vue+TS这种选型的经验，这篇主要借(chao)鉴(xi)了美团一名工程师的总结，也加入了自己的一些想法，希望能给在前端道路上不停探索的小伙伴们一点想法，欢迎fork&&star。
