# Constraint type
*необходимо знать:* [[CREATE]]
*теги:* #базы_данных  #sql 
*описание:* ограничения для столбцов.

---
## Типы constraint
- [[Constraint NOT NULL]] - строка не может содержать null Значения.
- [[Constraint PRIMARY KEY]] - когда требуется, чтобы был столбец с уникальными идентификаторами.
- [[Constraint FOREGIN KEY]] - когда значения этого столбца зависят от значений другого столбца. Данный столбец может содержать только те значения, которые есть в столбце, от которого зависит этот столбец.
- [[Constraint CHECK]] - принуждает использовать только значения, которые удовлетворяют его условиям.
- [[Constraint UNIQUE]] - уникальные значения или null.

Также вы можете создать [[Object INDEX]], которые также создадут некоторые ограничения.

## Операции с constraint

### Constraint после создания таблицы
```sql
alter table STUDENTS add constraint ST_ID_UNIQUE unique (ID);
--or
alter table STUDENTS modify (ID constraint ABC unique);
```

### Composite Constraint
- Ограничения одновременно на несколько столбцов

```sql
create table STUDENTS
(
    ID          number,
    NAME        varchar2(15),
    constraint ST_ID_UNIQUE UNIQUE (ID, name)
);
```
**В этом случае уникальными значениями должна быть связка id-name**

### Удаление constraint 
```sql
alter table STUDENTS drop constraint abc;
```


