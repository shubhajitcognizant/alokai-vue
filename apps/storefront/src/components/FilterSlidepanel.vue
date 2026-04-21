<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import type { Product } from '../modules/products/useProducts';
import {
  SfAccordionItem,
  SfButton,
  SfCounter,
  SfIconChevronLeft,
  SfIconClose,
  SfListItem,
  SfRadio,
  SfRating,
} from '@storefront-ui/vue';

const props = defineProps<{
  products: Product[];
  initialCategory?: string;
}>();

type FilterDetail = {
  id: string;
  label: string;
  value: string;
  counter?: number;
  link?: string;
};

type Node = {
  id: string;
  summary: string;
  type: string;
  details: FilterDetail[];
};

const filtersData = computed<Node[]>(() => {
  const categoryMap = new Map<string, number>();
  props.products.forEach((p) => {
    if (p.category) categoryMap.set(p.category, (categoryMap.get(p.category) ?? 0) + 1);
  });
  const dynamicCategories = Array.from(categoryMap.entries()).map(([cat, count]) => ({
    id: cat.toUpperCase().replace(/[\s&]+/g, '_'),
    label: cat.charAt(0).toUpperCase() + cat.slice(1),
    value: cat,
    counter: count,
  }));

  return [
  {
    id: 'acc2',
    summary: 'Category',
    type: 'category',
    details: dynamicCategories,
  },
  {
    id: 'acc5',
    summary: 'Price',
    type: 'price-range',
    details: [],
  },
  {
    id: 'acc6',
    summary: 'Rating',
    type: 'rating',
    details: [
      { id: 'r1', label: '5', value: '5', counter: props.products.filter((p) => Math.round(p.rating) >= 5).length },
      { id: 'r2', label: '4 & up', value: '4', counter: props.products.filter((p) => Math.round(p.rating) >= 4).length },
      { id: 'r3', label: '3 & up', value: '3', counter: props.products.filter((p) => Math.round(p.rating) >= 3).length },
      { id: 'r4', label: '2 & up', value: '2', counter: props.products.filter((p) => Math.round(p.rating) >= 2).length },
      { id: 'r5', label: '1 & up', value: '1', counter: props.products.filter((p) => Math.round(p.rating) >= 1).length },
    ],
  },
  ];
});

const emit = defineEmits<{
  'apply-filters': [filters: { rating: string; category: string; priceMin: number; priceMax: number }];
}>();

const maxProductPrice = computed(() =>
  props.products.length ? Math.ceil(Math.max(...props.products.map((p) => p.price))) : 0,
);

const opened = ref<boolean[]>(filtersData.value.map(() => true));
const priceMin = ref(0);
const priceMax = ref(0);
const ratingsModel = ref('');
const categoryModel = ref(props.initialCategory ?? '');

watch(maxProductPrice, (max) => {
  if (max > 0 && priceMax.value === 0) priceMax.value = max;
}, { immediate: true });

const handleClearFilters = () => {
  priceMin.value = 0;
  priceMax.value = maxProductPrice.value;
  ratingsModel.value = '';
  categoryModel.value = '';
  emit('apply-filters', { rating: '', category: '', priceMin: 0, priceMax: maxProductPrice.value });
};
const handleShowProducts = () => {
  emit('apply-filters', {
    rating: ratingsModel.value,
    category: categoryModel.value,
    priceMin: priceMin.value,
    priceMax: priceMax.value,
  });
};
</script>

<template>
  <aside class="w-full md:max-w-[376px]">
    <div class="flex justify-between mb-4">
      <div class="text-lg font-semibold">
        Filters
      </div>
      <button
        type="button"
        class="sm:hidden text-neutral-500"
        aria-label="Close filters panel"
      >
        <SfIconClose />
      </button>
    </div>
    <ul>
      <!-- prettier-ignore-attribute -->
      <li
        v-for="{ id: filterDataId, type, summary, details }, index in filtersData"
        :key="filterDataId"
      >
        <SfAccordionItem v-model="opened[index]">
          <template #summary>
            <div class="flex justify-between p-2 mb-2">
              <p class="p-2 font-medium typography-headline-5">
                {{ summary }}
              </p>
              <SfIconChevronLeft :class="opened[index] ? 'rotate-90' : '-rotate-90'" />
            </div>
          </template>
          <template v-if="type === 'category'">
            <fieldset id="radio-category">
              <SfListItem
                v-for="{ id, value, label, counter } in details"
                :key="id"
                tag="label"
                size="sm"
                class="px-1.5 bg-transparent hover:bg-transparent"
              >
                <template #prefix>
                  <SfRadio
                    v-model="categoryModel"
                    class="flex items-center"
                    name="radio-category"
                    :value="value"
                    @click="categoryModel = categoryModel === value ? '' : value"
                  />
                </template>
                <p>
                  <span :class="['text-sm mr-2', { 'font-medium': categoryModel === value }]">{{ label }}</span>
                  <SfCounter size="sm">
                    {{ counter }}
                  </SfCounter>
                </p>
              </SfListItem>
            </fieldset>
          </template>
          <template v-if="type === 'price-range'">
            <div class="px-2 pt-2 pb-4">
              <div class="price-slider-wrap">
                <div class="price-track">
                  <div
                    class="price-track-fill"
                    :style="{
                      left: `${(priceMin / maxProductPrice) * 100}%`,
                      width: `${((priceMax - priceMin) / maxProductPrice) * 100}%`,
                    }"
                  />
                </div>
                <input
                  type="range"
                  class="price-thumb"
                  :min="0"
                  :max="maxProductPrice"
                  :step="1"
                  :value="priceMin"
                  @input="priceMin = Math.min(Number(($event.target as HTMLInputElement).value), priceMax)"
                >
                <input
                  type="range"
                  class="price-thumb"
                  :min="0"
                  :max="maxProductPrice"
                  :step="1"
                  :value="priceMax"
                  @input="priceMax = Math.max(Number(($event.target as HTMLInputElement).value), priceMin)"
                >
              </div>
              <div class="flex justify-between mt-3 text-sm font-medium text-neutral-700">
                <span>${{ priceMin }}</span>
                <span>${{ priceMax }}</span>
              </div>
            </div>
          </template>
          <template v-if="type === 'rating'">
            <fieldset id="radio-ratings">
              <SfListItem
                v-for="{ id, value, label, counter } in details"
                :key="id"
                tag="label"
                size="sm"
                class="!items-center py-4 md:py-1 px-1.5 bg-transparent hover:bg-transparent"
              >
                <template #prefix>
                  <SfRadio
                    v-model="ratingsModel"
                    name="radio-ratings"
                    class="flex items-end"
                    :value="value"
                    @click="ratingsModel = ratingsModel === value ? '' : value"
                  />
                </template>
                <!-- TODO: Adjust the styling and remove block elements when/if span wrapper removed from ListItem -->
                <div class="flex flex-wrap items-center">
                  <SfRating
                    class="-mt-px"
                    :value="Number(value)"
                    :max="5"
                    size="sm"
                  />
                  <span :class="['mx-2 text-base md:text-sm', { 'font-medium': ratingsModel === value }]">{{
                    label
                  }}</span>
                  <SfCounter size="sm">
                    {{ counter }}
                  </SfCounter>
                </div>
              </SfListItem>
            </fieldset>
          </template>
        </SfAccordionItem>
        <hr class="my-4 border-neutral-200">
      </li>
    </ul>
    <div class="flex justify-between">
      <SfButton
        variant="secondary"
        class="w-full mr-3"
        @click="handleClearFilters()"
      >
        Clear all filters
      </SfButton>
      <SfButton
        class="w-full"
        @click="handleShowProducts"
      >
        Show products
      </SfButton>
    </div>
  </aside>
</template>

<style scoped>
.price-slider-wrap {
  position: relative;
  height: 6px;
  margin: 12px 0;
}

.price-track {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 6px;
  border-radius: 9999px;
  background-color: #e5e7eb;
}

.price-track-fill {
  position: absolute;
  height: 100%;
  border-radius: 9999px;
  background-color: var(--color-primary-700);
}

.price-thumb {
  position: absolute;
  top: -5px;
  left: 0;
  width: 100%;
  height: 16px;
  background: transparent;
  appearance: none;
  pointer-events: none;
  outline: none;
}

.price-thumb::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: #fff;
  border: 2px solid var(--color-primary-700);
  cursor: pointer;
  pointer-events: auto;
}

.price-thumb::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: #fff;
  border: 2px solid var(--color-primary-700);
  cursor: pointer;
  pointer-events: auto;
}
</style>
