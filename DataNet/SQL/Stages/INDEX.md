# INDEX
*Need to know:* [[Database Objects]]
*tegs:* #db #sql 
*description:* Объект базы данных, создваваемый с целью повышения производительности процесса поиска данных. Они позволяют получить данные из таблицы без перебора всех данных. **Индексы могут уменьить производительность DML команд кроме select** Индексы используют на таблицах, к которым делаются команды select.

---
Index принимает участие в констрэинтах `primary key` и `unique` ([[Constraint type]]).

Index находит строку по rowid, которую можно посмотреть:
```sql
select rowid from EMPLOYEES where FIRST_NAME = 'John';
select * from EMPLOYEES where rowid in ('AAARywAAEAAAIwOAAn', 'AAARywAAEAAAIwOAAK', 'AAARywAAEAAAIwOAAt');
```

Index автоматически создается для [[Constraint PRIMARY KEY]]. Index поиск проходит по уникальным значениям, игнорируя null.

Цели индексов: 
1. Проверка на уникальность.
2. Ускоренный поиск информации.

Есть два типа индексов - B-TREE и BITMAP.

### B-TREE
Эффиктивен, когда:
1. Таблицы большие (много строк)
2. Когда мы выбираем небольшое количество строк, относительно общего количества строк. (не больше 2-4%)
3. В столбце с индексом должно быть много уникальных значений.
#### Unique
Индекс не поддерживает хранение дубликатов.
#### Nonunique
**Используется по умолчанию**. Поддерживает хранение дубликатов.

### BITMAP
**Индекс по умолчанию**.

Предназначен для столбцов, в которых
1. Мало уникальных значений
2. Большое количество строк
3. Используется and, or , not.
![[Pasted image 20210327140932.png]]

Пример:
```sql
create bitmap index b_ind1 on STUDENTS(faculty_id);
```

**Oracle Standard Edition не поддерживает BITMAP!**
Проверить версию можно так:
```sql
select * from V$VERSION;
```

## Создание индексов B-TREE
>CREATE {`UNIQUE | BITMAP`} INDEX
`schema.`index_name ON
`schema.`table_name (column1`,column2,...`);

Пример:
```sql
-- B-TREE NONUNIQUE
Create index i11 on STUDENTS(id)

-- B-TREE UNIQUE 
Create unique index i2 on STUDENTS(name); 

--Composite index
Create index i3 on STUDENTS(name, id); 
```

## Удаление индексов
>DROP INDEX `schema.`index_name;