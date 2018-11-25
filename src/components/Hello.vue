<template>
    <div>
        <div class="greeting">Hello {{name}}{{exclamationMarks}}</div>
        <button @click="decrement">-</button>
        <button @click="increment">+</button>
    </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";

@Component
export default class HelloDecorator extends Vue {
    @Prop() name!: string;
    @Prop() initialEnthusiasm!: number;
    // 原data中的属性可以直接写
    enthusiasm = this.initialEnthusiasm;
    // 方法可以直接定义，不需要用methods包裹起来
    increment() {
        this.enthusiasm++;
    }
    decrement() {
        if (this.enthusiasm > 1) {
            this.enthusiam--;
        }
    }
    // 代替computed的写法
    get exclamationMarks(): string {
        return Array(this.enthusiam + 1).join("!");
    }
}

</script>

<style>
.greeting {
    font-size: 20px;
}
</style>