# Introduction in Data Structures
*status:* In process
*format:* stage
*tegs:* #programming #java #analysis #python #dataScience 
*desckription:* Все реализации алгоритмов доступны по [ссылке](https://www.manning.com/downloads/1368)

---
## Основные термины
==Адгоритм== - набор интсрукций для выполнения некоторой задачи.

==Время выполнения или О-большое== - описывает то, как возврастает время выполнения алгоритма с ростом размера входных данных. О-большое определяет время выполнения в худшем случае.

==Рекурсия== - когда метод вызывает сам себя. Важно понимать, что есть рекурсивный и базовый случай в рекурсивных методах.
В рекурсивном случае метод вызвает сам себя, а в базовом метод не вызывает, чтобы предоствратить зацикливание. Рекурсивные функции используют стек вызовов.

### Время выполнения алгоритмов:
- *O(n), Линейное* - когда максимальное количество попыток совпадает с размером списка. Например "простой поиск".
- *O(log(n), Логарифмическое* - [[$ Binary search]].
- *O(n \* log(n))* - [[$ Quick sort]] и другие эффективные алгоритмы сортировки.
- *O(n^2)* - [[$ Selection sort]] и другие медленные алгоритмы сортировки.
- *O(n!)* - очень медленные алгоритмы.

## Алгоритмы и стратегии:
- [[$ Binary search]] - на входе получает отсортированный список элементов. Если элемет, который вы ищете, присутствует в списке, то бинарный поиск возвращает ту позицию, в которой он был найден, иначе возвращает null. Бинарным поиском вы каждый раз загадываете число в середине диапазона и исключаете половину оставшихся чисел. Для списка из n элементов бинарный поиск выполняется за $log_2(n)$ шагов.
- ***Разделяй и властвуй*** - метод решения для решения задач, для которых не подходят обычные алгоритмы. Он состоит из двух шагов:
	1. Сначала определяется базовый случай. Это должнен быть простейший случай из всех возможных.
	2. Задача делится или сокрщается до тех пор, пока не будет сведена к базовому случаю.