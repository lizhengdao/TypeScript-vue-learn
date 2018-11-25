/*
 * @Author: wanglixing@xiaomi.com 
 * @Date: 2018-11-25 16:35:08 
 * @Last Modified by: wanglixing@xiaomi.com
 * @Last Modified time: 2018-11-25 16:43:33
 */
// 定义枚举 enum 是内置的枚举类型
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

// 经过上面的强类型约束 定义需要的接口如下
// 实际体验发现，如果没按照约定来写，就会报错
const needTypes: SrvType = {
    name: '',
    key: '',
    item: [
        {
            val: '',
            key: ''
        }
    ]
}

// 学习定义命名空间和返回类型
declare namespace Ajax {
    // axios 返回数据
    export interface AxiosResponse {
        data: AjaxResponse
    }

    // 请求接口的数据
    export interface AjaxResponse {
        code: number,
        data: object | null | Array<any>,
        message?: string
    }
}
// 上面的代码放在一个ajax.d.ts 会自动被ts给读取，并可以作为Ajax.AjaxResponse 来使用这个接口

// 以下是范型的使用例子，范性就是把类型最为一个参数来定义某种类型，只有在使用时才确定下来
function foo<T> (arg: T): T {
    return arg
}

let output = foo('string') // type of output will be 'string'

interface GenericInterface<T> {
    (arg: T): T
}

let myFoo: GenericInterface<number> = foo
let newFo: GenericInterface<string> = foo

// myFoo只能传入number类型，newFo只能传入string类型，解决了上面output没有声明类型的问题