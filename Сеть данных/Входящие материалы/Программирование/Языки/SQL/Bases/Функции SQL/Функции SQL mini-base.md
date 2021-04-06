 ### Метаданные
`необходимо знать:` 
`теги:` #базы_данных #sql/function 
`статус:` [[Динамический узел]]
`описание:` Функции не меняют данные в базе. Они нужны для извлечения данных и преобразования информации.

---
## Single-row functions 
Сколько информации на входе, столько и на входе (сколько стров в таблице, столько строк и будет обработано). Например вычисляет длину имени работников для каждой строки. Будет сформировано столько же строк.
#sql/function/single-row

Имеют несколько подразделений:
- *Character* - функции, работающие со строками. #sql/function/single-row/character
- *Numeric* - функции для чисел. #sql/function/single-row/numeric_func
- *Date* - для дат. #sql/function/single-row/date
- *Conversion* - преобразовывают типы данных. #sql/function/single-row/conversion
- *General* - работают с null-значениями #sql/function/single-row/general
- *Conditional* - условия. #sql/function/single-row/conditional

Функции могут быть вложенными:
```sql
SQL> select CONCAT(INITCAP('todaY'), CONCAT(' is ',SYSDATE || '. It''s cool!')) data from dual;

DATA
---------------------------------------
Today is 08-MAR-21. It's cool!
```

#TODO Добавить описания для каждой функции
### Character Functions
#### Case conversion functions
- [[LOWER function]]
- [[UPPER function]]
- [[INITCAP function]]
#### Character manipulations functions
- [[CONCAT function]]
- [[LENGTH function]]
- [[LPAD functions]]
- [[RPAD function]]
- [[TRIM function]]
- [[INSTR function]]
- [[SUBSTR function]]
- [[REPLACE function]]
- [[REGEXP_INSTR function]]
- [[REGEX_SUBSTR function]]
- [[REGEX_REPLACE function]]

### Numeric functions
- [[ROUND function]]
- [[TRUNC function]]
- [[MOD function]]
### Date functions
- [[SYSDATE funciton]]
- [[MONTHS_BETWEEN functions]]
- [[ADD_MONTHS function]]
- [[NEXT_DAY function]]
- [[LAST_DAY function]]
- [[ROUND function]]
- [[TRUNC function]]
### Conversion functions
- [[TO_CHAR function]]
- [[TO_DATE function]]
- [[TO_NUMBER function]]

### General functions
- [[NVL function]]
- [[NVL2 function]]
- [[NULLIF function]]
- [[COALESCE function]]

### Conditional functions
- [[DECODE function]]
- [[CASE function]]

## Multiple-row functions
Принимают информацию из многих строк и выводит одну. Например вычисляет длину имен всех работников и дает единый результат. Данные функции используются вместе с  [[SELECT#GROUP BY группировка]]
#sql/function/multiple-row

- [[COUNT function]] - считает строки по столбцу
- [[SUM function]] - вычисляет сумму числовых столбиков.
- [[AVG funtcion]] - среднее арифметическое.
- [[MIN funtcion]] - мин значение столбика.
- [[MAX function]] - макс значаение стобика.

**Чтобы выводить информацию с использованием выборки по multiply-row функциям, необходимо использовать `HAVING`:**
```sql
select DEPARTMENT_ID, count(*)  
from EMPLOYEES  
HAVING count(*) > 3  
group by DEPARTMENT_ID
```

Зато можно комбинировать single-row и multiply-row:
```sql
select round(sum(avg(length(upper(last\_name))))) from EMPLOYEES group by DEPARTMENT\_ID;
```
 