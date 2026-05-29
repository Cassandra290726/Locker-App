"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ScrollView,
  StyleSheet as RNStyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native-web";

import { FILTRO_TODAS_ID, type NotaCategoria } from "@/lib/notasShared";

const NARROW_MAX = 600;
const SCROLL_STEP = 140;

type Props = {
  categorias: NotaCategoria[];
  filterId: string;
  onFilterChange: (id: string) => void;
  onEditCategorias: () => void;
};

export default function NotasCategoriasScrollRN({
  categorias,
  filterId,
  onFilterChange,
  onEditCategorias,
}: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const [narrow, setNarrow] = useState(false);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const offsetRef = useRef(0);

  const updateArrows = useCallback((x: number, contentW: number, layoutW: number) => {
    offsetRef.current = x;
    setCanLeft(x > 4);
    setCanRight(x + layoutW < contentW - 4);
  }, []);

  useEffect(() => {
    const check = () => {
      const isNarrow = window.innerWidth < NARROW_MAX;
      setNarrow(isNarrow);
      if (isNarrow) {
        setCanRight(categorias.length > 2);
      } else {
        setCanLeft(false);
        setCanRight(false);
      }
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [categorias.length]);

  function scrollBy(delta: number) {
    const next = Math.max(0, offsetRef.current + delta);
    scrollRef.current?.scrollTo({ x: next, animated: true });
    offsetRef.current = next;
    setCanLeft(next > 4);
    setCanRight(true);
  }

  const pills = (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.catScroll}
      contentContainerStyle={styles.catScrollContent}
      onScroll={(e) => {
        const x = e.nativeEvent.contentOffset.x;
        const layoutW = e.nativeEvent.layoutMeasurement.width;
        const contentW = e.nativeEvent.contentSize.width;
        updateArrows(x, contentW, layoutW);
      }}
      scrollEventThrottle={32}
      onContentSizeChange={(w) => {
        if (typeof window !== "undefined") {
          const layoutW = Math.min(window.innerWidth - 120, 400);
          updateArrows(offsetRef.current, w, layoutW);
        }
      }}
    >
      <TouchableOpacity
        onPress={() => onFilterChange(FILTRO_TODAS_ID)}
        style={[
          styles.pill,
          styles.pillTodas,
          filterId === FILTRO_TODAS_ID && styles.pillSelected,
        ]}
        activeOpacity={0.85}
      >
        <Text
          style={[
            styles.pillText,
            filterId === FILTRO_TODAS_ID && styles.pillTextSelected,
          ]}
        >
          Todas
        </Text>
      </TouchableOpacity>

      {categorias.map((c) => {
        const on = filterId === c.id;
        return (
          <TouchableOpacity
            key={c.id}
            onPress={() => onFilterChange(c.id)}
            style={[styles.pill, { backgroundColor: c.color }, on && styles.pillRing]}
            activeOpacity={0.88}
          >
            <Text style={styles.pillText} numberOfLines={1}>
              {c.nombre}
            </Text>
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity
        style={styles.pencilBtn}
        onPress={onEditCategorias}
        activeOpacity={0.75}
        accessibilityLabel="Editar categorías"
      >
        <Text style={styles.pencilIcon}>✏️</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <View style={styles.catRowOuter}>
      {narrow && canLeft ? (
        <TouchableOpacity
          style={styles.arrowBtn}
          onPress={() => scrollBy(-SCROLL_STEP)}
          accessibilityLabel="Categorías anteriores"
          activeOpacity={0.8}
        >
          <Text style={styles.arrowTxt}>‹</Text>
        </TouchableOpacity>
      ) : null}
      <View style={styles.scrollWrap}>{pills}</View>
      {narrow && canRight ? (
        <TouchableOpacity
          style={styles.arrowBtn}
          onPress={() => scrollBy(SCROLL_STEP)}
          accessibilityLabel="Más categorías"
          activeOpacity={0.8}
        >
          <Text style={styles.arrowTxt}>›</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = RNStyleSheet.create({
  catRowOuter: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 4,
  },
  scrollWrap: {
    flex: 1,
    minWidth: 0,
  },
  catScroll: {
    maxHeight: 48,
  },
  catScrollContent: {
    alignItems: "center",
    gap: 10,
    paddingRight: 8,
  },
  pill: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 22,
    maxWidth: 140,
  },
  pillTodas: {
    backgroundColor: "#e7e5e4",
  },
  pillSelected: {
    borderWidth: 2,
    borderColor: "#292524",
  },
  pillRing: {
    borderWidth: 2,
    borderColor: "#292524",
  },
  pillText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1c1917",
  },
  pillTextSelected: {
    color: "#1c1917",
  },
  pencilBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d6d3d1",
    alignItems: "center",
    justifyContent: "center",
  },
  pencilIcon: {
    fontSize: 18,
  },
  arrowBtn: {
    width: 36,
    height: 42,
    borderRadius: 10,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d6d3d1",
    alignItems: "center",
    justifyContent: "center",
  },
  arrowTxt: {
    fontSize: 26,
    fontWeight: "700",
    color: "#806b63",
    lineHeight: 28,
  },
});
